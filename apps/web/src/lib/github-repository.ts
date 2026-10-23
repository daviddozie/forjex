export class ForgeRepositoryError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function parseGitHubRepository(value: unknown) {
  if (typeof value !== 'string')
    throw new ForgeRepositoryError('Enter a GitHub repository URL', 400);
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new ForgeRepositoryError('Enter a valid HTTPS GitHub repository URL', 400);
  }
  const match = url.pathname.match(/^\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9_.-]+?)\/?$/);
  if (
    url.protocol !== 'https:' ||
    url.host !== 'github.com' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !match
  ) {
    throw new ForgeRepositoryError('Use https://github.com/owner/repository', 400);
  }
  const repo = match[2].replace(/\.git$/, '');
  if (!repo || repo === '.' || repo === '..')
    throw new ForgeRepositoryError('Repository name is invalid', 400);
  return { owner: match[1], repo };
}
