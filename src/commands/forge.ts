import { createCommand, type StarterOptions } from './create.js';
import inquirer from 'inquirer';
import figlet from 'figlet';
import chalk from 'chalk';
import { GitHubService } from '../services/github.js';
import { GitService } from '../services/git.js';
import { ProjectDetector } from '../services/detector.js';
import { CICDGenerator } from '../services/cicd.js';
import { VercelService } from '../services/vercel.js';
import { CloudSyncService } from '../services/cloud-sync.js';
import { logger } from '../utils/logger.js';
import { getCloudUrl } from '../utils/config.js';
import type { RepoOptions } from '../types/index.js';

export async function forgeCommand(name?: string, options: StarterOptions = {}): Promise<void> {
  const originalDirectory = process.cwd();
  try {
    console.log('\n');
    console.log(
      chalk.cyan.bold(
        figlet.textSync('FORJEX', {
          font: 'Slant',
          horizontalLayout: 'default',
        }),
      ),
    );
    console.log(chalk.gray('  🚀 Automate GitHub repos & Vercel deployments'));
    console.log(chalk.gray('  ━'.repeat(25)));
    console.log('\n');

    let startNew = Boolean(name || options.template);
    if (!startNew) {
      const { projectMode } = await inquirer.prompt([
        {
          type: 'rawlist',
          name: 'projectMode',
          message: 'How would you like to start?',
          choices: [
            { name: 'Start a new project from a Forjex template', value: 'new' },
            { name: 'Use the existing project in this directory', value: 'existing' },
          ],
        },
      ]);
      startNew = projectMode === 'new';
    }
    let starterTemplate: string | undefined;
    if (startNew) {
      const starter = await createCommand(name, options);
      starterTemplate = starter.template;
      const { continueSetup } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continueSetup',
          message: 'Set up GitHub for this project now?',
          default: false,
        },
      ]);
      if (!continueSetup) return;
      if (['nextjs', 'react', 'vue'].includes(starterTemplate)) {
        const { existsSync } = await import('node:fs');
        if (!existsSync(`${starter.directory}/node_modules`)) {
          logger.info(
            'Install dependencies first, then run forjex forge from the new project directory.',
          );
          return;
        }
      } else if (options.vercel) {
        throw new Error(
          'Vercel setup is available for Next.js, React, and Vue starters. Your local project has been created.',
        );
      }
      process.chdir(starter.directory);
    }

    console.log(
      chalk.yellow('  Use ↑↓ arrow keys or number(1|2) to navigate, press ENTER to select\n'),
    );

    const { repoChoice } = await inquirer.prompt([
      {
        type: 'rawlist',
        name: 'repoChoice',
        message: 'What would you like to do with Forjex?',
        choices: [
          {
            name: 'Create a new GitHub repository',
            value: 'github-new',
            short: 'Create new repo',
          },
          {
            name: 'Push to an existing GitHub repository',
            value: 'github-existing',
            short: 'Push to existing',
          },
        ],
      },
    ]);

    console.log('\n');

    const { addCICD } = options.ci
      ? { addCICD: true }
      : await inquirer.prompt([
          {
            type: 'confirm',
            name: 'addCICD',
            message: 'Would you like to add a CI/CD pipeline (GitHub Actions)?',
            default: true,
          },
        ]);

    console.log('\n');

    const { deployVercel } =
      starterTemplate && !['nextjs', 'react', 'vue'].includes(starterTemplate)
        ? { deployVercel: false }
        : options.vercel
          ? { deployVercel: true }
          : await inquirer.prompt([
              {
                type: 'confirm',
                name: 'deployVercel',
                message: 'Would you like to deploy to Vercel?',
                default: true,
              },
            ]);

    console.log('\n');
    console.log(chalk.cyan('━'.repeat(50)));
    console.log(chalk.cyan.bold('  Starting setup...'));
    console.log(chalk.cyan('━'.repeat(50)));
    console.log('\n');

    let repoUrl: string = '';
    let repoOwner: string = '';
    let repoName: string = '';

    const githubService = new GitHubService();
    await githubService.authenticate();

    console.log('\n');

    if (repoChoice === 'github-new') {
      console.log(chalk.blue.bold('  STEP 1: Creating GitHub Repository\n'));

      const gitService = new GitService();

      const answers = await inquirer.prompt<RepoOptions>([
        {
          type: 'input',
          name: 'name',
          message: 'Repository name:',
          validate: (input) => input.length > 0 || 'Repository name is required',
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description (optional):',
        },
        {
          type: 'confirm',
          name: 'isPrivate',
          message: 'Make repository private?',
          default: false,
        },
        {
          type: 'confirm',
          name: 'addReadme',
          message: 'Add README.md?',
          default: true,
        },
        {
          type: 'rawlist',
          name: 'gitignore',
          message: 'Add .gitignore template:',
          choices: ['None', 'Node(JavaScript)', 'Python', 'Java', 'Go', 'Rust'],
          filter: (val: any) => (val === 'None' ? undefined : val),
        },
      ]);

      console.log('\n');

      repoUrl = await githubService.createRepository(answers);
      repoName = answers.name;

      const userInfo = await githubService.getUserInfo();
      repoOwner = userInfo.login;

      gitService.createLocalFiles({
        readme: answers.addReadme,
        gitignore: answers.gitignore,
        license: answers.license,
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
            default: true,
          },
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
              if (!input.includes('github.com'))
                return 'Please enter a valid GitHub repository URL';
              return true;
            },
          },
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
    console.log('\n');

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

    if (deployVercel) {
      console.log(chalk.blue.bold('  STEP 3: Preparing Vercel Configuration\n'));

      const vercelService = new VercelService();
      const projectName =
        repoName ||
        (repoUrl ? repoUrl.split('/').pop()?.replace('.git', '') : undefined) ||
        process.cwd().split('/').pop() ||
        'my-project';

      vercelService.createVercelConfigOnly(projectName, projectConfig);
      logger.success('✅ Vercel configuration created');
      console.log('\n');
    }

    if (repoUrl) {
      console.log(chalk.blue.bold('  STEP 4: Running Build Check\n'));

      const gitService = new GitService();

      await gitService.runBuildCheck(projectConfig);
      console.log('\n');

      console.log(chalk.blue.bold('  STEP 5: Pushing Code to GitHub\n'));

      const isRepo = await gitService.isGitRepository();
      const isExisting = repoChoice === 'github-existing';

      if (isRepo && !isExisting) {
        logger.warn('Directory is already a git repository');
        const { forceReinit } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'forceReinit',
            message: 'Commit and push changes?',
            default: true,
          },
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

    let vercelUrl = '';
    let autoDeploy = false;

    if (deployVercel) {
      console.log(chalk.blue.bold('  STEP 6: Deploying to Vercel\n'));

      const vercelService = new VercelService();
      await vercelService.authenticate();

      const projectName =
        repoName ||
        (repoUrl ? repoUrl.split('/').pop()?.replace('.git', '') : undefined) ||
        process.cwd().split('/').pop() ||
        'my-project';

      if (repoUrl && repoOwner && repoName) {
        const deployment = await vercelService.deployWithGitHub(
          projectName,
          projectConfig,
          repoOwner,
          repoName,
        );
        vercelUrl = deployment.url;
        autoDeploy = Boolean(deployment.autoDeploy);
      } else {
        const deployment = await vercelService.deploy(projectName, projectConfig);
        vercelUrl = deployment.url;
        autoDeploy = Boolean(deployment.autoDeploy);
      }
      console.log('\n');
    }

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

      if (autoDeploy) {
        console.log(chalk.green('Auto-deployment enabled!'));
        console.log(chalk.gray('     Future pushes to main will automatically deploy\n'));
      }
    }

    if (repoUrl && repoOwner && repoName) {
      try {
        const cloudSync = new CloudSyncService();
        const syncResult = await cloudSync.syncProject({
          name: repoName,
          repoOwner,
          repoName,
          repoUrl,
          description: projectConfig.framework || 'Bootstrapped with Forjex CLI',
          framework: projectConfig.framework || projectConfig.type || 'Web App',
          template: starterTemplate || projectConfig.framework || projectConfig.type,
          isLive: true,
          addCICD,
          deployVercel,
          vercelUrl: vercelUrl || undefined,
        });

        if (syncResult.success && syncResult.persisted) {
          console.log(chalk.gray('  ☁️  Cloud Dashboard:'));
          console.log(chalk.blue.bold(`     ${getCloudUrl()}/dashboard\n`));
        } else {
          logger.warn(
            'Project setup completed, but cloud sync was not persisted. Check your cloud connection and database configuration.',
          );
        }
      } catch {}
    }
  } catch (error: any) {
    if (!error.message?.startsWith('Build failed:')) {
      logger.error(error.message || 'An error occurred');
    }
    process.exitCode = 1;
  } finally {
    process.chdir(originalDirectory);
  }
}

function extractRepoInfo(repoUrl: string): { owner: string; name: string } {
  const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
  if (match) {
    return {
      owner: match[1],
      name: match[2].replace('.git', ''),
    };
  }
  throw new Error('Invalid GitHub repository URL');
}
