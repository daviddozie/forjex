export const AI_PROVIDERS = {
  openai: { label: 'OpenAI', keyEnv: 'OPENAI_API_KEY', defaultModel: 'gpt-4.1-mini' },
  openrouter: { label: 'OpenRouter', keyEnv: 'OPENROUTER_API_KEY', defaultModel: '' },
  gemini: { label: 'Google Gemini', keyEnv: 'GEMINI_API_KEY', defaultModel: '' },
  grok: { label: 'Grok (xAI)', keyEnv: 'XAI_API_KEY', defaultModel: '' },
  anthropic: { label: 'Anthropic Claude', keyEnv: 'ANTHROPIC_API_KEY', defaultModel: '' },
  mistral: { label: 'Mistral', keyEnv: 'MISTRAL_API_KEY', defaultModel: '' },
} as const;
export type AIProvider = keyof typeof AI_PROVIDERS;
export const DEFAULT_AI_MODEL = AI_PROVIDERS.openai.defaultModel;
export function isAIProvider(value: unknown): value is AIProvider {
  return typeof value === 'string' && Object.hasOwn(AI_PROVIDERS, value);
}
export function validAIModel(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,199}$/.test(value) &&
    value.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..')
  );
}
