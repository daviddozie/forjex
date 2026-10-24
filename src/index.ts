#!/usr/bin/env node

import { configureAICommand, aiStatusCommand, clearAICommand } from './commands/ai.js';

import { Command } from 'commander';
import { createAndSetupCommand } from './commands/create.js';
import { pushCommand } from './commands/push.js';
import { forgeCommand } from './commands/forge.js';
import { loginCommand, whoamiCommand, logoutCommand } from './commands/auth.js';
import { syncCommand } from './commands/sync.js';

const program = new Command();

program
  .name('forjex')
  .description('Automate GitHub repository creation, Vercel deployments, and Cloud sync')
  .version('1.8.0');

program
  .command('forge [name]')
  .description('Create GitHub repository, configure CI/CD, and deploy to Vercel')
  .option('--template <template>', 'Create a starter: nextjs, react, vue, python, go, rust')
  .option('--no-install', 'Skip dependency installation for a new starter')
  .option('--ci', 'Add CI/CD when continuing to GitHub setup')
  .option('--vercel', 'Deploy when continuing to GitHub setup')
  .option('--ai', 'Offer an AI commit message (set up with forjex ai configure)')
  .action((name, options) => forgeCommand(name, options));

program
  .command('create [name]')
  .description('Create a Forjex starter and optionally continue into GitHub, CI/CD, and deployment')
  .option('--template <template>', 'Starter: nextjs, react, vue, python, go, rust')
  .option('--no-install', 'Skip dependency installation')
  .option('--no-setup', 'Finish locally without the setup prompt')
  .option('--ai', 'Offer an AI commit message during GitHub setup')
  .action(async (name, options) => {
    await createAndSetupCommand(name, options);
  });

program
  .command('push')
  .description('Review changes, commit, and push the current branch to its existing remote')
  .option('--ai', 'Generate a commit message using OpenAI')
  .option('-m, --message <message>', 'Use your own commit message')
  .action(pushCommand);

const ai = program.command('ai').description('Configure optional OpenAI commit messages');
ai.command('configure')
  .description('Choose a model and optionally save an API key')
  .action(configureAICommand);
ai.command('status')
  .description('Show the effective AI settings without exposing the API key')
  .action(aiStatusCommand);
ai.command('clear').description('Remove saved AI settings').action(clearAICommand);

program
  .command('login')
  .description('Authenticate CLI with Forjex Cloud Dashboard')
  .option('-t, --token <token>', 'Manually provide GitHub Personal Access Token')
  .action(loginCommand);

program
  .command('whoami')
  .description('Display currently authenticated user, credentials, and cloud sync status')
  .action(whoamiCommand);

program
  .command('logout')
  .description('Log out and clear stored CLI credentials')
  .action(logoutCommand);

program
  .command('sync')
  .description('Synchronize projects with Forjex Cloud Dashboard')
  .action(syncCommand);

program.parseAsync().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Command failed');
  process.exitCode = 1;
});
