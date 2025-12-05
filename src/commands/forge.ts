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

        // STEP 1: Ask about GitHub repository
        const { repoChoice } = await inquirer.prompt([
            {
                type: 'rawlist',
                name: 'repoChoice',
                message: 'What would you like to do with Forjex?',
                choices: [
                    { 
                        name: 'Create a new GitHub repository', 
                        value: 'github-new',
                        short: 'Create new repo'
                    },
                    { 
                        name: 'Push to an existing GitHub repository', 
                        value: 'github-existing',
                        short: 'Push to existing'
                    }
                ]
            }
        ]);

        console.log('\n');

        // STEP 2: Ask about CI/CD
        const { addCICD } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'addCICD',
                message: 'Would you like to add a CI/CD pipeline (GitHub Actions)?',
                default: true
            }
        ]);

        console.log('\n');

        // STEP 3: Ask about Vercel
        const { deployVercel } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'deployVercel',
                message: 'Would you like to deploy to Vercel?',
                default: true
            }
        ]);

        console.log('\n');
        console.log(chalk.cyan('━'.repeat(50)));
        console.log(chalk.cyan.bold('  Starting setup...'));
        console.log(chalk.cyan('━'.repeat(50)));
        console.log('\n');

        // Variables to track repo info
        let repoUrl: string = '';
        let repoOwner: string = '';
        let repoName: string = '';

        // Authenticate with GitHub
        const githubService = new GitHubService();
        await githubService.authenticate();

        console.log('\n');

        // PROCESS 1: Handle GitHub repository creation/selection
        if (repoChoice === 'github-new') {
            console.log(chalk.blue.bold('  STEP 1: Creating GitHub Repository\n'));
            
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
                    type: 'rawlist',
                    name: 'gitignore',
                    message: 'Add .gitignore template:',
                    choices: ['None', 'Node', 'Python', 'Java', 'Go', 'Rust'],
                    filter: (val: any) => val === 'None' ? undefined : val
                },
                {
                    type: 'rawlist',
                    name: 'license',
                    message: 'Choose a license:',
                    choices: ['None', 'MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause'],
                    filter: (val: any) => val === 'None' ? undefined : val
                }
            ]);

            console.log('\n');

            // Create the repository
            repoUrl = await githubService.createRepository(answers);
            repoName = answers.name;

            // Get owner info
            const userInfo = await githubService.getUserInfo();
            repoOwner = userInfo.login;

            // Create local files
            gitService.createLocalFiles({
                readme: answers.addReadme,
                gitignore: answers.gitignore,
                license: answers.license
            });

            console.log('\n');

        } else if (repoChoice === 'github-existing') {
            console.log(chalk.blue.bold('  STEP 1: Connecting to Existing Repository\n'));
            
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

        // PROCESS 2: Detect project type
        const detector = new ProjectDetector();
        const projectConfig = detector.detect();
        console.log('\n');

        // PROCESS 3: Add CI/CD pipeline if requested
        if (addCICD) {
            console.log(chalk.blue.bold('  STEP 2: Setting up CI/CD Pipeline\n'));
            
            if (projectConfig.type !== 'unknown') {
                const cicdGenerator = new CICDGenerator(projectConfig);
                cicdGenerator.generate();
            } else {
                logger.warn('⚠️  Skipping CI/CD: Could not detect project type');
            }
            console.log('\n');
        }

        // PROCESS 4: Push to GitHub
        if (repoUrl) {
            console.log(chalk.blue.bold('  STEP 3: Pushing Code to GitHub\n'));
            
            const gitService = new GitService();
            const isRepo = await gitService.isGitRepository();
            const isExisting = repoChoice === 'github-existing';

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
            console.log('\n');
        }

        // PROCESS 5: Deploy to Vercel if requested
        let vercelUrl = '';
        if (deployVercel) {
            console.log(chalk.blue.bold('  STEP 4: Deploying to Vercel\n'));
            
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
            console.log('\n');
        }

        // Final success message
        console.log(chalk.cyan('━'.repeat(50)));
        logger.success('🎉 All done! Your project is ready.');
        console.log(chalk.cyan('━'.repeat(50)));
        console.log('\n');

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
        console.error(error);
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