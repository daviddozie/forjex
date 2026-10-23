import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Octokit } from '@octokit/rest';
import type { ForgeRepositoryOptions } from '../src/lib/forge-repository';
const { forgeRepository } = await import('../src/lib/forge-repository');
const { parseGitHubRepository } = await import('../src/lib/github-repository');

const options: ForgeRepositoryOptions = {
  repoMode: 'existing',
  existingRepoUrl: 'https://github.com/team/existing-app',
  name: 'ignored-new-name',
  description: 'Example',
  isPrivate: false,
  template: 'nextjs',
  addReadme: true,
  addCICD: true,
  deployVercel: true,
};

function github({
  files = [] as string[],
  writable = true,
  empty = false,
  contentDenied = false,
  conflict = false,
} = {}) {
  const calls: { method: string; path: string; query: string; body: any }[] = [];
  const repository = {
    id: 101,
    name: 'existing-app',
    owner: { login: 'team' },
    html_url: 'https://github.com/team/existing-app',
    private: true,
    default_branch: 'release/v1',
    permissions: { push: writable },
  };
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const url = new URL(
      typeof input === 'string' || input instanceof URL ? String(input) : input.url,
    );
    const method = init?.method || 'GET';
    const path = decodeURIComponent(url.pathname);
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    calls.push({ method, path, query: url.search, body });
    if (method === 'POST' && path === '/user/repos')
      return Response.json(repository, { status: 201 });
    if (method === 'GET' && path === '/repos/team/existing-app') return Response.json(repository);
    if (method === 'GET' && path.includes('/git/ref/'))
      return empty
        ? Response.json({ message: 'Git Repository is empty' }, { status: 409 })
        : Response.json({ object: { sha: 'head-before' } });
    if (method === 'GET' && path.includes('/contents/')) {
      if (contentDenied) return Response.json({ message: 'Forbidden' }, { status: 403 });
      return files.includes(path.split('/contents/')[1])
        ? Response.json({ type: 'file', sha: 'original-file' })
        : Response.json({ message: 'Not Found' }, { status: 404 });
    }
    if (method === 'GET' && path.endsWith('/git/commits/head-before'))
      return Response.json({ tree: { sha: 'original-base-tree' } });
    if (method === 'POST' && path.endsWith('/git/blobs'))
      return Response.json({ sha: 'favicon-blob' }, { status: 201 });
    if (method === 'POST' && path.endsWith('/git/trees'))
      return Response.json({ sha: 'configured-tree' }, { status: 201 });
    if (method === 'POST' && path.endsWith('/git/commits'))
      return Response.json({ sha: 'new-commit' }, { status: 201 });
    if (method === 'PATCH' && path.includes('/git/refs/'))
      return conflict
        ? Response.json({ message: 'Update is not a fast forward' }, { status: 422 })
        : Response.json({ object: { sha: 'new-commit' } });
    throw new Error(`Unexpected mocked GitHub request: ${method} ${path}`);
  };
  return {
    client: new Octokit({
      auth: 'test-token',
      request: { fetch },
      log: { debug() {}, info() {}, warn() {}, error() {} },
    }),
    calls,
  };
}

const writes = (calls: ReturnType<typeof github>['calls']) =>
  calls.filter((call) => call.method !== 'GET');

test('repository URLs accept HTTPS GitHub paths and reject other destinations', () => {
  assert.deepEqual(parseGitHubRepository(' https://github.com/team/project.git/ '), {
    owner: 'team',
    repo: 'project',
  });
  for (const url of [
    'http://github.com/team/project',
    'https://github.com.evil.test/team/project',
    'https://evil.test/team/project',
    'https://user:secret@github.com/team/project',
    'https://github.com/team/project/tree/main',
    'https://github.com/team/project?token=secret',
    'https://github.com/team/project#fragment',
    'not-a-url',
  ])
    assert.throws(() => parseGitHubRepository(url));
});

test('connecting an already configured repository preserves every file and creates no commit', async () => {
  const { client, calls } = github({
    files: ['package.json', 'README.md', '.github/workflows/ci.yml', 'vercel.json'],
  });
  const result = await forgeRepository(client, options);
  assert.equal(result.action, 'connected');
  assert.equal(result.repository.name, 'existing-app');
  assert.equal(result.branch, 'release/v1');
  assert.equal(result.sha, 'head-before');
  assert.deepEqual(result.skippedFiles, ['.github/workflows/ci.yml', 'vercel.json']);
  assert.deepEqual(writes(calls), []);
});

test('connecting adds only missing configuration on the actual default branch', async () => {
  const { client, calls } = github();
  const result = await forgeRepository(client, options);
  assert.equal(result.sha, 'new-commit');
  const tree = calls.find((call) => call.path.endsWith('/git/trees'))!;
  assert.equal(tree.body.base_tree, 'original-base-tree');
  const workflow = tree.body.tree.find(
    (item: any) => item.path === '.github/workflows/ci.yml',
  ).content;
  assert.match(workflow, /branches: \["release\/v1"\]/);
  assert.equal(workflow.includes('branches: [main, master]'), false);
  assert.deepEqual(
    tree.body.tree.map((item: any) => item.path),
    ['.github/workflows/ci.yml', 'vercel.json'],
  );
  assert.equal(
    calls.some((call) => call.path === '/user/repos'),
    false,
  );
  assert.equal(
    calls
      .filter((call) => call.path.includes('/contents/'))
      .every((call) => new URLSearchParams(call.query).get('ref') === 'release/v1'),
    true,
  );
  const commit = calls.find(
    (call) => call.method === 'POST' && call.path.endsWith('/git/commits'),
  )!;
  assert.deepEqual(commit.body.parents, ['head-before']);
  const update = calls.find((call) => call.method === 'PATCH')!;
  assert.equal(update.path, '/repos/team/existing-app/git/refs/heads/release/v1');
  assert.equal(update.body.force, false);
});

test('existing Vercel configuration is preserved while missing CI is added', async () => {
  const { client, calls } = github({ files: ['vercel.json'] });
  const result = await forgeRepository(client, options);
  assert.deepEqual(result.changedFiles, ['.github/workflows/ci.yml']);
  assert.deepEqual(result.skippedFiles, ['vercel.json']);
  assert.deepEqual(
    calls.find((call) => call.path.endsWith('/git/trees'))!.body.tree.map((item: any) => item.path),
    ['.github/workflows/ci.yml'],
  );
});

test('read-only repository access is rejected before any write', async () => {
  const { client, calls } = github({ writable: false });
  await assert.rejects(forgeRepository(client, options), (error: any) => error.status === 403);
  assert.deepEqual(writes(calls), []);
  assert.equal(calls.length, 1);
});

test('content permission failures are not mistaken for missing configuration', async () => {
  const { client, calls } = github({ contentDenied: true });
  await assert.rejects(forgeRepository(client, options), (error: any) => error.status === 403);
  assert.deepEqual(writes(calls), []);
});

test('empty existing repositories fail without scaffolding or replacing their contents', async () => {
  const { client, calls } = github({ empty: true });
  await assert.rejects(
    forgeRepository(client, options),
    (error: any) => error.status === 409 && /initial commit/.test(error.message),
  );
  assert.deepEqual(writes(calls), []);
});

test('a concurrent branch update fails without force pushing or retrying', async () => {
  const { client, calls } = github({ conflict: true });
  await assert.rejects(forgeRepository(client, options), (error: any) => error.status === 422);
  const updates = calls.filter((call) => call.method === 'PATCH');
  assert.equal(updates.length, 1);
  assert.equal(updates[0].body.force, false);
});

test('new repositories honor the README choice in their final tree', async () => {
  for (const addReadme of [false, true]) {
    const { client, calls } = github();
    await forgeRepository(client, { ...options, repoMode: 'new', name: 'new-app', addReadme });
    assert.equal(calls[0].path, '/user/repos');
    assert.equal(calls[0].body.name, 'new-app');
    const readme = calls
      .find((call) => call.path.endsWith('/git/trees'))!
      .body.tree.find((item: any) => item.path === 'README.md');
    if (addReadme) assert.equal(typeof readme.content, 'string');
    else assert.equal(readme.sha, null);
  }
});

test('binary favicons are uploaded as base64 blobs and linked into the repository tree', async () => {
  const { client, calls } = github();
  await forgeRepository(client, { ...options, repoMode: 'new', name: 'new-app' });
  const blob = calls.find((call) => call.path.endsWith('/git/blobs'))!;
  assert.equal(blob.body.encoding, 'base64');
  assert.equal(Buffer.from(blob.body.content, 'base64').readUInt16LE(2), 1);
  const icon = calls
    .find((call) => call.path.endsWith('/git/trees'))!
    .body.tree.find((file: any) => file.path === 'src/app/favicon.ico');
  assert.equal(icon.sha, 'favicon-blob');
  assert.equal(icon.content, undefined);
});

test('connecting never replaces a source file used as a configuration parent directory', async () => {
  const { client, calls } = github({ files: ['.github'] });
  await assert.rejects(
    forgeRepository(client, options),
    (error: any) => error.status === 409 && /not a directory/.test(error.message),
  );
  assert.deepEqual(writes(calls), []);
});
