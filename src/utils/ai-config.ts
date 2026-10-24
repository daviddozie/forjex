import { randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { AI_PROVIDERS, isAIProvider, validAIModel, type AIProvider } from '../ai/settings.js';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey?: string;
}
const defaultDirectory = () => join(homedir(), '.forjex');

export function loadAIConfig(directory = defaultDirectory()): AIConfig | null {
  try {
    const config = JSON.parse(readFileSync(join(directory, 'ai.json'), 'utf8'));
    if (!isAIProvider(config.provider) || !validAIModel(config.model)) return null;
    if (config.apiKey !== undefined && (typeof config.apiKey !== 'string' || !config.apiKey.trim()))
      return null;
    return config;
  } catch {
    return null;
  }
}

export function saveAIConfig(config: AIConfig, directory = defaultDirectory()) {
  if (!isAIProvider(config.provider) || !validAIModel(config.model))
    throw new Error('Invalid AI configuration.');
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const file = join(directory, 'ai.json');
  const temporary = join(directory, `.ai.${randomUUID()}.tmp`);
  try {
    writeFileSync(temporary, JSON.stringify(config, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    renameSync(temporary, file);
  } finally {
    rmSync(temporary, { force: true });
  }
}

export function clearAIConfig(directory = defaultDirectory()) {
  rmSync(join(directory, 'ai.json'), { force: true });
}

export function resolveAIConfig(env: NodeJS.ProcessEnv = process.env, saved = loadAIConfig()) {
  const provider = env.FORJEX_AI_PROVIDER || saved?.provider || 'openai';
  if (!isAIProvider(provider)) throw new Error('Unsupported AI provider. Run forjex ai configure.');
  const matching = saved?.provider === provider ? saved : null;
  const model = env.FORJEX_AI_MODEL || matching?.model || AI_PROVIDERS[provider].defaultModel;
  if (!validAIModel(model))
    throw new Error('Choose a model with forjex ai configure or FORJEX_AI_MODEL.');
  const environmentKey =
    env[AI_PROVIDERS[provider].keyEnv] || (provider === 'gemini' ? env.GOOGLE_API_KEY : undefined);
  return {
    provider,
    model,
    apiKey: environmentKey || matching?.apiKey || '',
    keySource: environmentKey
      ? 'environment'
      : matching?.apiKey
        ? 'saved configuration'
        : 'not configured',
  };
}
