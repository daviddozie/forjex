export interface RepoOptions {
    name: string;
    description?: string;
    isPrivate: boolean;
    addReadme: boolean;
    license?: string;
    gitignore?: string;
}

export interface AuthConfig {
    token?: string;
    expiresAt?: number;
}