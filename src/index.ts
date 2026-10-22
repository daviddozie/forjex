#!/usr/bin/env node

import { Command } from 'commander';
import { forgeCommand } from './commands/forge.js';
import { loginCommand, whoamiCommand, logoutCommand } from './commands/auth.js';
import { syncCommand } from './commands/sync.js';

const program = new Command();

program
    .name('forjex')
    .description('Automate GitHub repository creation, Vercel deployments, and Cloud sync')
    .version('1.6.4');

program
    .command('forge')
    .description('Create GitHub repository, configure CI/CD, and deploy to Vercel')
    .action(forgeCommand);

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
    // Provider errors can contain request credentials; show only the message.
    console.error(error instanceof Error ? error.message : 'Command failed');
    process.exitCode = 1;
});