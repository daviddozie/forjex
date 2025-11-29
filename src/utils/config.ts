import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import type { AuthConfig } from '../types/index.js';

const CONFIG_DIR = join(homedir(), '.forjex');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function ensureConfigDir(): void {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
    }
}

export function saveConfig(config: AuthConfig): void {
    ensureConfigDir();
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
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
    if (!config?.token || !config?.expiresAt) return false;
    return Date.now() < config.expiresAt;
}