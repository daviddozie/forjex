import inquirer from 'inquirer';
import { loadAIConfig, saveAIConfig, clearAIConfig, resolveAIConfig } from '../utils/ai-config.js';
import { validAIModel, AI_PROVIDERS, type AIProvider } from '../ai/settings.js';

export async function configureAICommand() {
  if (!process.stdin.isTTY)
    throw new Error(
      'Run forjex ai configure in an interactive terminal. Environment variables are also supported.',
    );
  const saved = loadAIConfig();
  const { provider } = await inquirer.prompt<{ provider: AIProvider }>([
    {
      type: 'rawlist',
      name: 'provider',
      message: 'AI provider:',
      choices: Object.entries(AI_PROVIDERS).map(([value, item]) => ({ name: item.label, value })),
      default: saved?.provider || 'openai',
    },
  ]);
  const selected = AI_PROVIDERS[provider];
  const matching = saved?.provider === provider ? saved : null;
  console.log(`Choose a text-generation model available to your ${selected.label} account.`);
  console.log(
    `FORJEX_AI_PROVIDER, FORJEX_AI_MODEL, and ${selected.keyEnv} can override saved settings.`,
  );
  const { model, saveKey } = await inquirer.prompt([
    {
      type: 'input',
      name: 'model',
      message: 'Model ID:',
      default: matching?.model || selected.defaultModel,
      validate: (value: string) =>
        validAIModel(value.trim()) ||
        'Enter a model ID using letters, numbers, dots, colons, slashes, underscores, or hyphens.',
      filter: (value: string) => value.trim(),
    },
    {
      type: 'confirm',
      name: 'saveKey',
      message: `Save a ${selected.label} API key in ~/.forjex/ai.json? This is a plaintext file readable by your user account.`,
      default: Boolean(matching?.apiKey),
    },
  ]);
  let apiKey: string | undefined;
  if (saveKey) {
    const { keepKey } = matching?.apiKey
      ? await inquirer.prompt([
          { type: 'confirm', name: 'keepKey', message: 'Keep the saved API key?', default: true },
        ])
      : { keepKey: false };
    if (keepKey) apiKey = matching?.apiKey;
    else
      ({ apiKey } = await inquirer.prompt([
        {
          type: 'password',
          name: 'apiKey',
          message: `${selected.label} API key:`,
          mask: '*',
          validate: (value: string) => Boolean(value.trim()) || 'An API key is required.',
          filter: (value: string) => value.trim(),
        },
      ]));
  }
  saveAIConfig({ provider, model, ...(apiKey ? { apiKey } : {}) });
  console.log(`Saved AI model: ${model}.`);
  if (!apiKey)
    console.log(
      `Set ${selected.keyEnv} in your terminal environment to use AI. Any previously saved AI key has been removed.`,
    );
  console.log('Run forjex ai status to inspect the effective configuration.');
}

export function aiStatusCommand() {
  const config = resolveAIConfig();
  console.log(
    `Provider: ${AI_PROVIDERS[config.provider].label}\nModel: ${config.model}\nAPI key: ${config.keySource}`,
  );
}

export function clearAICommand() {
  clearAIConfig();
  console.log('Saved AI settings removed. Environment variables still apply.');
}
