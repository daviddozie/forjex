export interface RepoOptions {
  name: string;
  description?: string;
  isPrivate: boolean;
  addReadme: boolean;
  license?: string;
  gitignore?: string;
  addCICD?: boolean;
  pushToGitHub?: boolean;
  deployToVercel?: boolean;
}

export interface AuthConfig {
  token?: string;
  expiresAt?: number;
  githubToken?: string;
  vercelToken?: string;
  vercelTeamId?: string;
  cloudUrl?: string;
  user?: {
    name: string;
    username: string;
    avatar: string;
    profileUrl: string;
  };
  loggedInAt?: string;
}

export interface ProjectConfig {
  type: 'nodejs' | 'python' | 'go' | 'rust' | 'unknown';
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun';
  hasTests?: boolean;
  buildCommand?: string;
  testCommand?: string;
  framework?: string;
}

export interface VercelDeployment {
  autoDeploy?: boolean;
  url: string;
  deploymentUrl: string;
  projectId: string;
}
