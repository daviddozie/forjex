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
    vercelToken?: string;
    vercelTeamId?: string;
    user?: {
        name: string;
        username: string;
        avatar: string;
        profileUrl: string;
    };
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
    url: string;
    deploymentUrl: string;
    projectId: string;
}