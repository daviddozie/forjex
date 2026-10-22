import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from 'fs';
import type { AuthConfig } from '../types/index.js';

const CONFIG_DIR = join(homedir(), '.forjex');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function ensureConfigDir(): void {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
    }
}

export function saveConfig(config: AuthConfig): void {
    ensureConfigDir();
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
    chmodSync(CONFIG_FILE, 0o600);
}

export function loadConfig(): AuthConfig | null {
    if (!existsSync(CONFIG_FILE)) return null;
    try {
        return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    } catch {
        return null;
    }
}

export function isTokenValid(config: AuthConfig | null): boolean {
    if (!config) return false;
    const token = config.githubToken || config.token;
    if (!token) return false;
    if (config.expiresAt && Date.now() > config.expiresAt) return false;
    return true;
}

export function clearConfig(): void {
    if (existsSync(CONFIG_FILE)) {
        writeFileSync(CONFIG_FILE, JSON.stringify({}, null, 2));
    }
}

export function getCloudUrl(): string {
    const config = loadConfig();
    const value = process.env.FORJEX_CLOUD_URL || config?.cloudUrl || 'http://localhost:3000';
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash ||
        (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) {
        throw new Error('Cloud URL must use HTTPS (HTTP is allowed on localhost) and contain no credentials, query, or fragment');
    }
    return value.replace(/\/$/, '');
}
