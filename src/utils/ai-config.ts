import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, chmodSync, rmSync } from 'node:fs';
import { DEFAULT_AI_MODEL, validAIModel } from '../ai/settings.js';

export interface AIConfig {
  provider: 'openai';
  model: string;
  apiKey?: string;
}
const defaultDirectory = () => join(homedir(), '.forjex');

export function loadAIConfig(directory = defaultDirectory()): AIConfig | null {
  try {
    const config = JSON.parse(readFileSync(join(directory, 'ai.json'), 'utf8'));
    if (config.provider !== 'openai' || !validAIModel(config.model)) return null;
    if (config.apiKey !== undefined && (typeof config.apiKey !== 'string' || !config.apiKey.trim()))
      return null;
    return config;
  } catch {
    return null;
  }
}

export function saveAIConfig(config: AIConfig, directory = defaultDirectory()) {
  if (config.provider !== 'openai' || !validAIModel(config.model))
    throw new Error('Invalid AI configuration.');
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const file = join(directory, 'ai.json');
  writeFileSync(file, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 });
  chmodSync(file, 0o600);
}

export function clearAIConfig(directory = defaultDirectory()) {
  rmSync(join(directory, 'ai.json'), { force: true });
}

export function resolveAIConfig(env: NodeJS.ProcessEnv = process.env, saved = loadAIConfig()) {
  const model = env.FORJEX_AI_MODEL || saved?.model || DEFAULT_AI_MODEL;
  if (!validAIModel(model))
    throw new Error('Invalid AI model. Run forjex ai configure or set FORJEX_AI_MODEL.');
  return {
    provider: 'openai' as const,
    model,
    apiKey: env.OPENAI_API_KEY || saved?.apiKey || '',
    keySource: env.OPENAI_API_KEY
      ? 'environment'
      : saved?.apiKey
        ? 'saved configuration'
        : 'not configured',
  };
}
