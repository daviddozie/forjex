import inquirer from 'inquirer';
import figlet from 'figlet';
import chalk from 'chalk';
import { GitHubService } from '../services/github.js';
import { GitService } from '../services/git.js';
import { ProjectDetector } from '../services/detector.js';
import { CICDGenerator } from '../services/cicd.js';
import { VercelService } from '../services/vercel.js';
import { logger } from '../utils/logger.js';
import type { RepoOptions } from '../types/index.js';

export async function forgeCommand(): Promise<void> {
    try {
        // Display FORJEX banner
        console.log('\n');
        console.log(
            chalk.cyan.bold(
                figlet.textSync('FORJEX', {
                    font: 'Slant',
                    horizontalLayout: 'default'
                })
            )
        );
        console.log(chalk.gray('  🚀 Automate GitHub repos & Vercel deployments'));
        console.log(chalk.gray('  ━'.repeat(25)));
        console.log('\n');

        // Step 0: Ask what user wants to do
        const { actions } = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'actions',
                message: 'What would you like to do?',
                choices: [
                    { name: 'Push to GitHub', value: 'github', checked: true },
                    { name: 'Add CI/CD pipeline (GitHub Actions)', value: 'cicd', checked: true },
                    { name: 'Deploy to Vercel', value: 'vercel', checked: true }
                ],
                validate: (choices) => choices.length > 0 || 'Please select at least one action'
            }
        ]);

        const shouldPushToGitHub = actions.includes('github');
        const shouldAddCICD = actions.includes('cicd');
        const shouldDeployToVercel = actions.includes('vercel');

        let githubService: GitHubService | null = null;
        let repoUrl: string = '';

        // Step 1: GitHub Setup (if selected)
        if (shouldPushToGitHub) {
            githubService = new GitHubService();
            await githubService.authenticate();

            console.log('\n');

            // Step 2: Collect repository details
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

            console.log('\n');

            // Step 3: Create repository
            repoUrl = await githubService.createRepository(answers);

            // Step 3.5: Create files locally
            const gitService = new GitService();
            gitService.createLocalFiles({
                readme: answers.addReadme,
                gitignore: answers.gitignore,
                license: answers.license
            });
        }

        // Detect project type (needed for CI/CD and Vercel)
        const detector = new ProjectDetector();
        const projectConfig = detector.detect();

        // Step 4: CI/CD Setup (if selected)
        if (shouldAddCICD) {
            if (projectConfig.type !== 'unknown') {
                const cicdGenerator = new CICDGenerator(projectConfig);
                cicdGenerator.generate();
            } else {
                logger.warn('⚠️  Skipping CI/CD: Could not detect project type');
            }
        }

        // Step 5: Vercel Deployment (if selected)
        let vercelUrl = '';
        if (shouldDeployToVercel) {
            const vercelService = new VercelService();
            await vercelService.authenticate();

            const projectName = repoUrl
                ? repoUrl.split('/').pop()?.replace('.git', '') || 'my-project'
                : process.cwd().split('/').pop() || 'my-project';

            const deployment = await vercelService.deploy(projectName, projectConfig);
            vercelUrl = deployment.url;

            // Add Vercel to CI/CD if both are selected
            if (shouldAddCICD && repoUrl) {
                await vercelService.addVercelToGitHubActions(repoUrl);
            }
        }

        // Step 6: Push to GitHub (if selected)
        if (shouldPushToGitHub && repoUrl) {
            const gitService = new GitService();
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
                if (!forceReinit) {
                    console.log('\n');
                    logger.success('🎉 Setup complete!');
                    if (repoUrl) logger.info(`GitHub: ${chalk.cyan(repoUrl)}`);
                    if (vercelUrl) logger.info(`Vercel: ${chalk.cyan(vercelUrl)}`);
                    return;
                }
            }

            await gitService.initAndPush(repoUrl);
        }

        // Final summary
        console.log('\n');
        logger.success('🎉 All done! Your project is ready.');
        if (repoUrl) logger.info(`📦 GitHub: ${chalk.cyan(repoUrl)}`);
        if (vercelUrl) logger.info(`🚀 Vercel: ${chalk.cyan(vercelUrl)}`);

    } catch (error: any) {
        logger.error(error.message || 'An error occurred');
        process.exit(1);
    }
}