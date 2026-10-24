export const DEFAULT_AI_MODEL = 'gpt-4.1-mini';

export function validAIModel(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(value);
}
