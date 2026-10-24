import inquirer from 'inquirer';
import { loadAIConfig, saveAIConfig, clearAIConfig, resolveAIConfig } from '../utils/ai-config.js';
import { validAIModel, DEFAULT_AI_MODEL } from '../ai/settings.js';

export async function configureAICommand() {
  if (!process.stdin.isTTY)
    throw new Error(
      'Run forjex ai configure in an interactive terminal. Environment variables are also supported.',
    );
  const saved = loadAIConfig();
  console.log(
    'Provider: OpenAI. Choose a text model with Responses API and structured-output support.',
  );
  console.log('Environment variables OPENAI_API_KEY and FORJEX_AI_MODEL override saved settings.');
  const { model, saveKey } = await inquirer.prompt([
    {
      type: 'input',
      name: 'model',
      message: 'Model ID:',
      default: saved?.model || process.env.FORJEX_AI_MODEL || DEFAULT_AI_MODEL,
      validate: (value: string) =>
        validAIModel(value.trim()) ||
        'Enter a model ID using letters, numbers, dots, colons, underscores, or hyphens.',
      filter: (value: string) => value.trim(),
    },
    {
      type: 'confirm',
      name: 'saveKey',
      message:
        'Save an OpenAI API key in ~/.forjex/ai.json? This is a plaintext file readable by your user account.',
      default: false,
    },
  ]);
  let apiKey: string | undefined;
  if (saveKey) {
    const { keepKey } = saved?.apiKey
      ? await inquirer.prompt([
          { type: 'confirm', name: 'keepKey', message: 'Keep the saved API key?', default: true },
        ])
      : { keepKey: false };
    if (keepKey) apiKey = saved?.apiKey;
    else
      ({ apiKey } = await inquirer.prompt([
        {
          type: 'password',
          name: 'apiKey',
          message: 'OpenAI API key:',
          mask: '*',
          validate: (value: string) => Boolean(value.trim()) || 'An API key is required.',
          filter: (value: string) => value.trim(),
        },
      ]));
  }
  saveAIConfig({ provider: 'openai', model, ...(apiKey ? { apiKey } : {}) });
  console.log(`Saved AI model: ${model}.`);
  if (!apiKey)
    console.log(
      'Set OPENAI_API_KEY in your terminal environment to use AI. Any previously saved AI key has been removed.',
    );
  console.log('Run forjex ai status to inspect the effective configuration.');
}

export function aiStatusCommand() {
  const config = resolveAIConfig();
  console.log(`Provider: OpenAI\nModel: ${config.model}\nAPI key: ${config.keySource}`);
}

export function clearAICommand() {
  clearAIConfig();
  console.log('Saved AI settings removed. Environment variables still apply.');
}
