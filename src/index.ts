#!/usr/bin/env node

import { Command } from 'commander';
import { forgeCommand } from './commands/forge.js';

const program = new Command();

program
    .name('forjex')
    .description('Automate GitHub repository creation and deployment')
    .version('1.0.0');

program
    .command('forge')
    .description('Create GitHub repository and push code')
    .action(forgeCommand);

program.parse();