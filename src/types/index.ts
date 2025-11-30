export interface RepoOptions {
    name: string;
    description?: string;
    isPrivate: boolean;
    addReadme: boolean;
    license?: string;
    gitignore?: string;
    addCICD?: boolean;
}

export interface AuthConfig {
    token?: string;
    expiresAt?: number;
}

export interface ProjectConfig {
    type: 'nodejs' | 'python' | 'go' | 'rust' | 'unknown';
    packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun';
    hasTests?: boolean;
    buildCommand?: string;
    testCommand?: string;
}