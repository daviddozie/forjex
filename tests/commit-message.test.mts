import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  generateAICommitMessage,
  prepareCommitInput,
  validateCommitMessage,
} from '../src/ai/commit-message';
import { stagedChanges } from '../src/services/commit-generator';

const complete = (title = 'feat(cli): continue project setup') =>
  Response.json({
    status: 'completed',
    output: [
      { type: 'reasoning' },
      {
        type: 'message',
        content: [
          {
            type: 'output_text',
            text: JSON.stringify({
              title,
              body: 'Offer repository setup after creating the starter.',
            }),
          },
        ],
      },
    ],
  });

test('AI sees bounded changes across files, with sensitive paths, binary data and recognized secrets excluded', async () => {
  const changes = [
    { path: '.env.local', content: 'SUPER_SECRET=do-not-send' },
    {
      path: 'src/auth.ts',
      content: 'const apiKey = "secret-value";\nconst key = "sk-abcdefghijklmnopqrstuvwxyz";',
    },
    { path: 'src/cli.ts', content: '+continueSetup();' },
    { path: 'favicon.ico', content: 'binary-data', binary: true },
  ];
  const result = await generateAICommitMessage(changes, {
    apiKey: 'test-key',
    fetch: async (url, init) => {
      assert.equal(url, 'https://api.openai.com/v1/responses');
      const body = JSON.parse(String(init?.body));
      assert.equal(body.store, false);
      assert.match(body.input, /continueSetup/);
      assert.match(body.input, /REDACTED/);
      for (const secret of [
        'secret-value',
        'sk-abcdefghijklmnopqrstuvwxyz',
        'SUPER_SECRET',
        'binary-data',
      ])
        assert.ok(!body.input.includes(secret));
      return complete();
    },
  });
  assert.equal(result.message.split('\n')[0], 'feat(cli): continue project setup');
  assert.deepEqual(result.included, ['src/auth.ts', 'src/cli.ts']);
  assert.deepEqual(result.omitted, ['.env.local', 'favicon.ico']);
  const prepared = prepareCommitInput(
    Array.from({ length: 100 }, (_, index) => ({
      path: `src/${index}.ts`,
      content: 'x'.repeat(20_000),
    })),
  );
  assert.equal(prepared.included.length, 4);
  assert.equal(prepared.omitted.length, 96);
  assert.ok(prepared.input.length < 50_000);
});

test('AI rejects absent credentials, empty eligible input, upstream errors, invalid and incomplete responses', async () => {
  const changes = [{ path: 'src/main.ts', content: '+hello();' }];
  await assert.rejects(generateAICommitMessage(changes, { apiKey: '' }), /key/);
  await assert.rejects(
    generateAICommitMessage([{ path: '.env', content: 'secret' }], { apiKey: 'test' }),
    /eligible/,
  );
  for (const response of [
    new Response('private upstream detail', { status: 429 }),
    Response.json({ status: 'incomplete' }),
    complete('invented title'),
    Response.json({ status: 'completed', output: [] }),
  ]) {
    await assert.rejects(
      generateAICommitMessage(changes, { apiKey: 'test', fetch: async () => response }),
      (error) => error instanceof Error && !error.message.includes('private upstream detail'),
    );
  }
  for (const message of ['', '\0bad', 'x'.repeat(4001)])
    assert.throws(() => validateCommitMessage(message));
});

test('staged snapshot includes deletions and excludes unstaged changes', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'forjex-staged-'));
  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd: directory, encoding: 'utf8' });
  try {
    git('init', '-b', 'feature/messages');
    git('config', 'user.name', 'Test');
    git('config', 'user.email', 'test@example.com');
    writeFileSync(join(directory, 'deleted.ts'), 'export const old = true;\n');
    git('add', '.');
    git('commit', '-m', 'initial');
    git('rm', 'deleted.ts');
    writeFileSync(join(directory, 'staged.ts'), 'export const staged = true;\n');
    git('add', 'staged.ts');
    writeFileSync(join(directory, 'staged.ts'), 'export const staged = "UNSTAGED_SECRET";\n');
    const changes = await stagedChanges(directory);
    assert.equal(changes.length, 2);
    assert.match(
      changes.find((change) => change.path === 'deleted.ts')!.content,
      /-export const old/,
    );
    assert.ok(!JSON.stringify(changes).includes('UNSTAGED_SECRET'));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('push commits only the index and pushes the current feature branch without rewriting existing messages', () => {
  const directory = mkdtempSync(join(tmpdir(), 'forjex-push-'));
  const remote = join(directory, 'remote.git');
  const work = join(directory, 'work');
  const git = (cwd: string, ...args: string[]) =>
    execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    git(directory, 'init', '--bare', remote);
    git(directory, 'init', '-b', 'feature/messages', work);
    git(work, 'config', 'user.name', 'Test');
    git(work, 'config', 'user.email', 'test@example.com');
    git(work, 'remote', 'add', 'origin', remote);
    writeFileSync(join(work, 'file.txt'), 'staged\n');
    git(work, 'add', 'file.txt');
    writeFileSync(join(work, 'file.txt'), 'unstaged\n');
    const result = spawnSync(
      process.execPath,
      [
        '--import',
        fileURLToPath(new URL('../node_modules/tsx/dist/loader.mjs', import.meta.url)),
        fileURLToPath(new URL('../src/index.ts', import.meta.url)),
        'push',
        '-m',
        'feat: add staged content',
      ],
      { cwd: work, encoding: 'utf8' },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(git(work, 'log', '-1', '--format=%s').trim(), 'feat: add staged content');
    assert.equal(git(work, 'show', 'HEAD:file.txt'), 'staged\n');
    assert.equal(git(remote, 'show', 'feature/messages:file.txt'), 'staged\n');
    assert.match(git(work, 'diff'), /unstaged/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
