import { createHash } from 'node:crypto';
import { validateCommitMessage } from '../../../../src/ai/commit-message';
import type { Octokit } from '@octokit/rest';
import {
  getCICDWorkflowContent,
  getGitignoreContent,
  getReadmeContent,
  getTemplateFiles,
  type TemplateFile,
  getVercelConfigContent,
} from '@/lib/templates-content';

import { ForgeRepositoryError, parseGitHubRepository } from '@/lib/github-repository';
export { ForgeRepositoryError, parseGitHubRepository } from '@/lib/github-repository';

export interface ForgeRepositoryOptions {
  repoMode: 'new' | 'existing';
  existingRepoUrl?: string;
  name: string;
  description: string;
  isPrivate: boolean;
  template: string;
  addReadme: boolean;
  addCICD: boolean;
  deployVercel: boolean;
  commitMessage?: string;
  commitPlanHash?: string;
}

export async function forgeRepository(client: Octokit, options: ForgeRepositoryOptions) {
  const connecting = options.repoMode === 'existing';
  const { data: repository } = connecting
    ? await client.repos.get(parseGitHubRepository(options.existingRepoUrl))
    : await client.repos.createForAuthenticatedUser({
        name: options.name,
        description: options.description,
        private: options.isPrivate,
        auto_init: true,
      });

  if (
    connecting &&
    !repository.permissions?.push &&
    !repository.permissions?.admin &&
    !repository.permissions?.maintain
  ) {
    throw new ForgeRepositoryError('You need write access to connect this repository', 403);
  }
  const owner = repository.owner.login;
  const repo = repository.name;
  const branch = repository.default_branch || 'main';
  let head = '';
  for (let attempt = 0; attempt < (connecting ? 1 : 5); attempt++) {
    try {
      const { data } = await client.git.getRef({ owner, repo, ref: `heads/${branch}` });
      head = data.object.sha;
      break;
    } catch (error: any) {
      if (![404, 409].includes(error.status)) throw error;
      if (!connecting && attempt < 4) await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }
  if (!head)
    throw new ForgeRepositoryError(
      connecting
        ? 'Push an initial commit to this repository before connecting it'
        : `Repository created at ${repository.html_url}, but its default branch is not ready. Complete setup in GitHub.`,
      409,
    );

  const { additions, skippedFiles } = await prepareForgeChanges(
    client,
    options,
    owner,
    repo,
    branch,
  );
  if (options.commitPlanHash && options.commitPlanHash !== commitPlanHash(additions, options)) {
    throw new ForgeRepositoryError(
      'Repository changes differ from the commit preview. Generate a new message and review again.',
      409,
    );
  }
  const removeReadme = !connecting && !options.addReadme;
  if (additions.length || removeReadme) {
    const { data: parent } = await client.git.getCommit({ owner, repo, commit_sha: head });
    const tree = await Promise.all(
      additions.map(async (file) => {
        const entry = { path: file.path, mode: '100644' as const, type: 'blob' as const };
        if (file.encoding === 'base64') {
          const { data: blob } = await client.git.createBlob({
            owner,
            repo,
            content: file.content,
            encoding: 'base64',
          });
          return { ...entry, sha: blob.sha };
        }
        return { ...entry, content: file.content };
      }),
    );
    const { data: createdTree } = await client.git.createTree({
      owner,
      repo,
      base_tree: parent.tree.sha,
      tree: [
        ...tree,
        ...(removeReadme
          ? [{ path: 'README.md', mode: '100644' as const, type: 'blob' as const, sha: null }]
          : []),
      ],
    });
    const { data: commit } = await client.git.createCommit({
      owner,
      repo,
      message: options.commitMessage
        ? validateCommitMessage(options.commitMessage)
        : connecting
          ? 'chore: configure repository with Forjex'
          : 'feat: bootstrap project with Forjex',
      tree: createdTree.sha,
      parents: [head],
    });
    await client.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: commit.sha,
      force: false,
    });
    head = commit.sha;
  }
  return {
    repository,
    branch,
    sha: head,
    skippedFiles,
    changedFiles: additions.map((file) => file.path),
    action: connecting ? ('connected' as const) : ('created' as const),
  };
}

export function commitPlanHash(files: TemplateFile[], options: ForgeRepositoryOptions): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        // A new repository's default branch is assigned by GitHub at creation time.
        // Bind that one workflow value symbolically in a read-only preview.
        files:
          options.repoMode === 'new'
            ? files.map((file) =>
                file.path === '.github/workflows/ci.yml'
                  ? {
                      ...file,
                      content: getCICDWorkflowContent(options.template, '<default-branch>'),
                    }
                  : file,
              )
            : files,
        mode: options.repoMode,
        repo:
          options.repoMode === 'existing'
            ? parseGitHubRepository(options.existingRepoUrl)
            : options.name,
        addReadme: options.addReadme,
      }),
    )
    .digest('hex');
}

export async function prepareForgeChanges(
  client: Octokit,
  options: ForgeRepositoryOptions,
  owner: string,
  repo: string,
  branch: string,
) {
  const connecting = options.repoMode === 'existing';
  const files: TemplateFile[] = [];
  if (!connecting) {
    files.push(
      { path: '.gitignore', content: getGitignoreContent(options.template) },
      ...getTemplateFiles(options.template, repo),
    );
    if (options.addReadme)
      files.push({
        path: 'README.md',
        content: getReadmeContent(
          options.template,
          repo,
          owner,
          options.addCICD,
          options.deployVercel,
        ),
      });
  }
  if (options.addCICD)
    files.push({
      path: '.github/workflows/ci.yml',
      content: getCICDWorkflowContent(options.template, branch),
    });
  if (options.deployVercel)
    files.push({ path: 'vercel.json', content: getVercelConfigContent(options.template, repo) });

  const skippedFiles: string[] = [];
  const additions: typeof files = [];
  for (const file of files) {
    if (connecting) {
      try {
        await client.repos.getContent({ owner, repo, path: file.path, ref: branch });
        skippedFiles.push(file.path);
        continue;
      } catch (error: any) {
        if (error.status !== 404) throw error;
      }
    }
    if (connecting && file.path.includes('/')) {
      const parts = file.path.split('/');
      for (let depth = 1; depth < parts.length; depth++) {
        const path = parts.slice(0, depth).join('/');
        try {
          const { data } = await client.repos.getContent({ owner, repo, path, ref: branch });
          if (!Array.isArray(data))
            throw new ForgeRepositoryError(
              `Cannot add configuration because ${path} is not a directory`,
              409,
            );
        } catch (error: any) {
          if (error.status !== 404) throw error;
          break;
        }
      }
    }
    additions.push(file);
  }

  return { additions, skippedFiles };
}
