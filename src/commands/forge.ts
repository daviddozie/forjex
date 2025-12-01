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

        // Ask what user wants to do
        const { actions } = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'actions',
                message: 'What would you like forjex to do for you?',
                choices: [
                    { name: '✨ Create a new GitHub repository', value: 'github-new', checked: true },
                    { name: '🔗 Push to an existing GitHub repository', value: 'github-existing' },
                    { name: '⚙️  Add CI/CD pipeline (GitHub Actions)', value: 'cicd', checked: true },
                    { name: '🚀 Deploy to Vercel', value: 'vercel', checked: true }
                ],
                validate: (choices) => choices.length > 0 || 'Please select at least one action'
            }
        ]);

        const shouldCreateNewRepo = actions.includes('github-new');
        const shouldPushToExisting = actions.includes('github-existing');
        const shouldPushToGitHub = shouldCreateNewRepo || shouldPushToExisting;
        const shouldAddCICD = actions.includes('cicd');
        const shouldDeployToVercel = actions.includes('vercel');

        let githubService: GitHubService | null = null;
        let repoUrl: string = '';

        // GitHub Setup (if selected)
        if (shouldPushToGitHub) {
            githubService = new GitHubService();
            await githubService.authenticate();

            console.log('\n');

            if (shouldCreateNewRepo) {
                // Create new repository
                const gitService = new GitService();

                const answers = await inquirer.prompt<RepoOptions>([
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

                // Create repository
                repoUrl = await githubService.createRepository(answers);

                // Create files locally
                gitService.createLocalFiles({
                    readme: answers.addReadme,
                    gitignore: answers.gitignore,
                    license: answers.license
                });

            } else if (shouldPushToExisting) {
                // Push to existing repository
                const gitService = new GitService();
                const existingRemote = await gitService.getRemoteUrl();

                if (existingRemote) {
                    // Found existing remote
                    const { useExisting } = await inquirer.prompt([
                        {
                            type: 'confirm',
                            name: 'useExisting',
                            message: `Found existing remote: ${chalk.cyan(existingRemote)}\nUse this repository?`,
                            default: true
                        }
                    ]);

                    if (useExisting) {
                        repoUrl = existingRemote;
                        logger.success(`✅ Using existing repository`);
                        console.log('\n');
                    }
                }

                // If no remote found or user declined
                if (!repoUrl) {
                    const { existingRepoUrl } = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'existingRepoUrl',
                            message: 'Enter the existing repository URL:',
                            validate: (input) => {
                                if (!input) return 'Repository URL is required';
                                if (!input.includes('github.com')) return 'Please enter a valid GitHub repository URL';
                                return true;
                            }
                        }
                    ]);

                    repoUrl = existingRepoUrl;
                    logger.info(`Using repository: ${chalk.cyan(repoUrl)}`);
                    console.log('\n');
                }
            }
        }

        // Detect project type (needed for CI/CD and Vercel)
        const detector = new ProjectDetector();
        const projectConfig = detector.detect();

        // CI/CD Setup (if selected)
        if (shouldAddCICD) {
            if (projectConfig.type !== 'unknown') {
                const cicdGenerator = new CICDGenerator(projectConfig);
                cicdGenerator.generate();
            } else {
                logger.warn('⚠️  Skipping CI/CD: Could not detect project type');
            }
        }

        // Vercel Deployment (if selected)
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

        // Push to GitHub (if selected)
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
                    if (repoUrl) {
                        console.log(chalk.gray('  📦 GitHub Repository:'));
                        console.log(chalk.cyan.bold(`     ${repoUrl}\n`));
                    }
                    if (vercelUrl) {
                        console.log(chalk.gray('  🚀 Live Deployment:'));
                        console.log(chalk.magenta.bold(`     ${vercelUrl}\n`));
                    }
                    return;
                }
            }

            await gitService.initAndPush(repoUrl);
        }

        // Final summary
        console.log('\n');
        logger.success('🎉 All done! Your project is ready.\n');
        if (repoUrl) {
            console.log(chalk.gray('  📦 GitHub Repository:'));
            console.log(chalk.cyan.bold(`     ${repoUrl}\n`));
        }
        if (vercelUrl) {
            console.log(chalk.gray('  🚀 Live Deployment:'));
            console.log(chalk.magenta.bold(`     ${vercelUrl}\n`));
        }

    } catch (error: any) {
        logger.error(error.message || 'An error occurred');
        process.exit(1);
    }
}