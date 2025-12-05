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

        const { repoChoice } = await inquirer.prompt([
            {
                type: 'list',
                name: 'repoChoice',
                message: 'What would you like to do with GitHub?',
                choices: [
                    { name: '✨ Create a new GitHub repository', value: 'create-new' },
                    { name: '🔗 Push to an existing GitHub repository', value: 'push-existing' }
                ]
            }
        ]);

        console.log('\n');

        const { addCICD } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'addCICD',
                message: 'Would you like to add a CI/CD pipeline (GitHub Actions)?',
                default: true
            }
        ]);

        console.log('\n');

        const { deployVercel } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'deployVercel',
                message: 'Would you like to deploy to Vercel?',
                default: true
            }
        ]);

        console.log('\n');

        // Now start the processes
        let githubService: GitHubService | null = null;
        let repoUrl: string = '';
        let repoOwner: string = '';
        let repoName: string = '';

        // Authenticate with GitHub
        githubService = new GitHubService();
        await githubService.authenticate();

        console.log('\n');

        // Handle repository creation/selection
        if (repoChoice === 'create-new') {
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
                    message: 'Add .gitignore template (optional):',
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

            repoUrl = await githubService.createRepository(answers);
            repoName = answers.name;

            const userInfo = await githubService.getUserInfo();
            repoOwner = userInfo.login;

            gitService.createLocalFiles({
                readme: answers.addReadme,
                gitignore: answers.gitignore,
                license: answers.license
            });

        } else if (repoChoice === 'push-existing') {
            const gitService = new GitService();
            const existingRemote = await gitService.getRemoteUrl();

            if (existingRemote) {
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
                    const repoInfo = extractRepoInfo(existingRemote);
                    repoOwner = repoInfo.owner;
                    repoName = repoInfo.name;
                    logger.success(`✅ Using existing repository`);
                    console.log('\n');
                }
            }

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
                const repoInfo = extractRepoInfo(existingRepoUrl);
                repoOwner = repoInfo.owner;
                repoName = repoInfo.name;
                logger.info(`Using repository: ${chalk.cyan(repoUrl)}`);
                console.log('\n');
            }
        }

        const detector = new ProjectDetector();
        const projectConfig = detector.detect();

        if (addCICD) {
            if (projectConfig.type !== 'unknown') {
                const cicdGenerator = new CICDGenerator(projectConfig);
                cicdGenerator.generate();
            } else {
                logger.warn('⚠️  Skipping CI/CD: Could not detect project type');
            }
        }

        if (repoUrl) {
            const gitService = new GitService();
            const isRepo = await gitService.isGitRepository();
            const isExisting = repoChoice === 'push-existing' || (isRepo && repoChoice !== 'create-new');

            if (isRepo && !isExisting) {
                logger.warn('Directory is already a git repository');
                const { forceReinit } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'forceReinit',
                        message: 'Commit and push changes?',
                        default: true
                    }
                ]);
                if (!forceReinit) {
                    console.log('\n');
                    logger.success('🎉 Setup complete!');
                    console.log(chalk.gray('  📦 GitHub Repository:'));
                    console.log(chalk.cyan.bold(`     ${repoUrl}\n`));
                    return;
                }
            }

            await gitService.initAndPush(repoUrl, isExisting);
        }

        let vercelUrl = '';
        if (deployVercel) {
            const vercelService = new VercelService();
            await vercelService.authenticate();

            const projectName = repoName ||
                (repoUrl ? repoUrl.split('/').pop()?.replace('.git', '') : undefined) ||
                process.cwd().split('/').pop() ||
                'my-project';

            // Deploy with GitHub integration
            if (repoUrl && repoOwner && repoName) {
                const deployment = await vercelService.deployWithGitHub(
                    projectName,
                    projectConfig,
                    repoOwner,
                    repoName
                );
                vercelUrl = deployment.url;
            } else {
                const deployment = await vercelService.deploy(projectName, projectConfig);
                vercelUrl = deployment.url;
            }
        }

        // Final success message
        console.log('\n');
        logger.success('🎉 All done! Your project is ready.\n');

        if (repoUrl) {
            console.log(chalk.gray('  📦 GitHub Repository:'));
            console.log(chalk.cyan.bold(`     ${repoUrl}\n`));
        }

        if (vercelUrl) {
            console.log(chalk.gray('  🚀 Live Deployment:'));
            console.log(chalk.magenta.bold(`     ${vercelUrl}\n`));

            if (repoUrl) {
                console.log(chalk.green('  ✅ Auto-deployment enabled!'));
                console.log(chalk.gray('     Future pushes to main will automatically deploy\n'));
            }
        }

    } catch (error: any) {
        logger.error(error.message || 'An error occurred');
        process.exit(1);
    }
}

// Helper function to extract owner and repo name from GitHub URL
function extractRepoInfo(repoUrl: string): { owner: string; name: string } {
    const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (match) {
        return {
            owner: match[1],
            name: match[2].replace('.git', '')
        };
    }
    throw new Error('Invalid GitHub repository URL');
}