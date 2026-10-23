#!/usr/bin/env node

import { Command } from 'commander';
import { createCommand } from './commands/create.js';
import { forgeCommand } from './commands/forge.js';
import { loginCommand, whoamiCommand, logoutCommand } from './commands/auth.js';
import { syncCommand } from './commands/sync.js';

const program = new Command();

program
  .name('forjex')
  .description('Automate GitHub repository creation, Vercel deployments, and Cloud sync')
  .version('1.7.0');

program
  .command('forge [name]')
  .description('Create GitHub repository, configure CI/CD, and deploy to Vercel')
  .option('--template <template>', 'Create a starter: nextjs, react, vue, python, go, rust')
  .option('--no-install', 'Skip dependency installation for a new starter')
  .option('--ci', 'Add CI/CD when continuing to GitHub setup')
  .option('--vercel', 'Deploy when continuing to GitHub setup')
  .action(forgeCommand);

program
  .command('create [name]')
  .description('Create a local Forjex starter without a GitHub account')
  .option('--template <template>', 'Starter: nextjs, react, vue, python, go, rust')
  .option('--no-install', 'Skip dependency installation')
  .action(async (name, options) => {
    await createCommand(name, options);
  });

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
