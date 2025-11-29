import inquirer from 'inquirer';
import { GitHubService } from '../services/github.js';
import { GitService } from '../services/git.js';
import { logger } from '../utils/logger.js';
import type { RepoOptions } from '../types/index.js';

export async function forgeCommand(): Promise<void> {
    try {
        // Authenticate
        const githubService = new GitHubService();
        await githubService.authenticate();

        // Collect repository details
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Repository name:',
                validate: (input) => input.length > 0 || 'Repository name is required'
            },
            {
                type: 'input',
                name: 'description',
                message: 'Description (optional):'
            },
            {
                type: 'confirm',
                name: 'isPrivate',
                message: 'Make repository private?',
                default: false
            },
            {
                type: 'confirm',
                name: 'addReadme',
                message: 'Add README.md?',
                default: true
            },
            {
                type: 'list',
                name: 'gitignore',
                message: 'Add .gitignore template:',
                choices: ['None', 'Node', 'Python', 'Java', 'Go', 'Rust'],
                filter: (val) => val === 'None' ? undefined : val
            },
            {
                type: 'list',
                name: 'license',
                message: 'Choose a license:',
                choices: ['None', 'MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause'],
                filter: (val) => val === 'None' ? undefined : val
            }
        ]);

        // Create repository
        const repoUrl = await githubService.createRepository(answers);

        const gitService = new GitService();
        gitService.createLocalFiles({
            readme: answers.addReadme,
            gitignore: answers.gitignore,
            license: answers.license
        });

        console.time('⏱️  Prompt time');

        // Push local code
        const { shouldPush } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'shouldPush',
                message: 'Push current directory to GitHub?',
                default: true
            }
        ]);

        console.timeEnd('⏱️  Prompt time')

        if (shouldPush) {
            const gitService = new GitService();

            // Check if already a git repo
            const isRepo = await gitService.isGitRepository();
            if (isRepo) {
                logger.warn('Directory is already a git repository');
                const { forceReinit } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'forceReinit',
                        message: 'Reinitialize and push anyway?',
                        default: false
                    }
                ]);
                if (!forceReinit) return;
            }

            await gitService.initAndPush(repoUrl);
        }

        logger.success('\n🎉 All done! Your repository is ready.');
    } catch (error: any) {
        logger.error(error.message || 'An error occurred');
        process.exit(1);
    }
}