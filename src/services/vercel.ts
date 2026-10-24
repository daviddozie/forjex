import { execSync, execFileSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { logger } from '../utils/logger.js';
import { saveConfig, loadConfig } from '../utils/config.js';
import type { ProjectConfig, VercelDeployment } from '../types/index.js';
import chalk from 'chalk';

export class VercelService {
  private isAuthenticated: boolean = false;

  createVercelConfigOnly(projectName: string, projectConfig: ProjectConfig): void {
    this.createVercelConfig(projectName, projectConfig);
  }

  async authenticate(): Promise<void> {
    try {
      try {
        execSync('vercel --version', { stdio: 'ignore' });
      } catch {
        const spinner = logger.spinner('Installing Vercel CLI...');
        execSync('npm install -g vercel', { stdio: 'inherit' });
        spinner.succeed('Vercel CLI installed');
      }

      try {
        this.runVercel(['whoami']);
        this.isAuthenticated = true;
        logger.success('Authenticated with Vercel');
        return;
      } catch {
        const token = loadConfig()?.vercelToken;
        if (token && token !== 'authenticated')
          throw new Error('Vercel token could not be verified. Reconnect your credentials.');
      }

      console.log('\n');
      logger.info('🔐 Opening browser to authenticate with Vercel...');
      console.log(chalk.yellow.bold('\n  ⚡ Press [ENTER] to open your browser\n'));

      execFileSync('vercel', ['login'], { stdio: 'inherit' });

      const currentConfig = loadConfig() || {};
      saveConfig({
        ...currentConfig,
        vercelToken: 'authenticated',
      });

      this.isAuthenticated = true;
      logger.success('✅ Vercel authentication successful!');
    } catch (error: any) {
      logger.error('Vercel authentication failed');
      throw error;
    }
  }

  async deploy(
    projectName: string,
    projectConfig: ProjectConfig,
    _githubRepoUrl?: string,
  ): Promise<VercelDeployment> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated with Vercel');
    }

    const sanitizedName = this.sanitizeProjectName(projectName);
    const spinner = logger.spinner('🚀 Deploying to Vercel...');

    try {
      this.createVercelConfig(sanitizedName, projectConfig);

      spinner.text = '📦 Building and deploying...';

      const deployOutput = this.runVercel(['--prod', '--yes']);

      const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
      const deploymentUrl = urlMatch ? urlMatch[0] : '';
      if (!deploymentUrl) throw new Error('Vercel did not return a deployment URL');

      spinner.text = '🔍 Getting project URL...';
      let productionUrl = deploymentUrl;

      try {
        const inspectOutput = this.runVercel(['inspect', deploymentUrl, '--yes']);

        const prodUrlMatch = inspectOutput.match(/url:\s+(https:\/\/[^\s]+\.vercel\.app)/i);
        if (prodUrlMatch) {
          productionUrl = prodUrlMatch[1];
        }
      } catch {
        productionUrl = deploymentUrl;
      }

      spinner.succeed(`✅ Deployed to Vercel`);
      console.log(chalk.magenta.bold(`   ${productionUrl}\n`));

      return {
        url: productionUrl,
        deploymentUrl: deploymentUrl,
        projectId: sanitizedName,
      };
    } catch (error: any) {
      spinner.fail('Deployment to Vercel failed');
      throw error;
    }
  }

  async deployWithGitHub(
    projectName: string,
    projectConfig: ProjectConfig,
    repoOwner: string,
    repoName: string,
  ): Promise<VercelDeployment> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated with Vercel');
    }

    const sanitizedName = this.sanitizeProjectName(projectName);
    const spinner = logger.spinner('🚀 Deploying to Vercel with GitHub integration...');

    try {
      this.createVercelConfig(sanitizedName, projectConfig);

      spinner.text = '🔗 Linking GitHub repository...';

      try {
        this.runVercel(['link', '--yes', '--project', sanitizedName]);
        spinner.text = '✅ GitHub repository linked';
      } catch {
        logger.warn('⚠️  Could not auto-link repository, deploying normally...');
      }

      spinner.text = '📦 Building and deploying...';

      const deployOutput = this.runVercel(['--prod', '--yes']);

      const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
      const deploymentUrl = urlMatch ? urlMatch[0] : '';
      if (!deploymentUrl) throw new Error('Vercel did not return a deployment URL');

      spinner.text = '🔍 Getting project URL...';
      let productionUrl = deploymentUrl;

      try {
        const inspectOutput = this.runVercel(['inspect', deploymentUrl, '--yes']);

        const prodUrlMatch = inspectOutput.match(/url:\s+(https:\/\/[^\s]+\.vercel\.app)/i);
        if (prodUrlMatch) {
          productionUrl = prodUrlMatch[1];
        }
      } catch {
        productionUrl = deploymentUrl;
      }

      let autoDeploy = false;
      try {
        spinner.text = '🔗 Setting up auto-deployment...';
        this.runVercel(['git', 'connect', `https://github.com/${repoOwner}/${repoName}`, '--yes']);
        autoDeploy = true;
      } catch {
        logger.warn(
          '⚠️  If Auto deployment setup is incomplete. You may need to connect GitHub manually.',
        );
        console.log(chalk.gray('   Visit: ') + chalk.cyan(`https://vercel.com/dashboard`));
        console.log(chalk.gray('   Then: Project Settings → Git → Connect Repository\n'));
      }

      spinner.succeed(`✅ Deployed to Vercel with GitHub integration`);
      console.log(chalk.magenta.bold(`   ${productionUrl}\n`));

      if (autoDeploy) logger.success('Auto-deployment configured');

      return {
        url: productionUrl,
        deploymentUrl: deploymentUrl,
        projectId: sanitizedName,
        autoDeploy,
      };
    } catch (error: any) {
      spinner.fail('Deployment to Vercel failed');
      throw error;
    }
  }

  private runVercel(args: string[]): string {
    const config = loadConfig();
    const token = config?.vercelToken;
    const options = token && token !== 'authenticated' ? ['--token', token] : [];
    if (config?.vercelTeamId) options.push('--scope', config.vercelTeamId);
    try {
      return execFileSync('vercel', [...args, ...options], {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 600000,
      });
    } catch {
      throw new Error(
        'Vercel command failed. Check your credentials and project in the Vercel dashboard.',
      );
    }
  }

  private sanitizeProjectName(name: string): string {
    let sanitized =
      name
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '-')
        .replace(/--+/g, '-')
        .replace(/---+/g, '-')
        .replace(/^[-._]+|[-._]+$/g, '')
        .replace(/^[-]+|[-]+$/g, '')
        .substring(0, 100) || 'my-project';

    if (/\d/.test(sanitized)) {
      sanitized = sanitized
        .replace(/\d+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^[-._]+|[-._]+$/g, '');
    }

    return sanitized;
  }

  private createVercelConfig(projectName: string, projectConfig: ProjectConfig): void {
    if (existsSync('vercel.json')) {
      return;
    }

    const config: any = {
      name: projectName,
      version: 2,
    };

    if (projectConfig.type === 'nodejs') {
      const framework = this.detectFramework();

      if (framework) {
        config.framework = framework;
      }

      if (projectConfig.buildCommand) {
        config.buildCommand = projectConfig.buildCommand;
      }
      if (['vue', 'vite-react'].includes(projectConfig.framework || '')) {
        config.rewrites = [{ source: '/docs', destination: '/index.html' }];
      }
    }

    writeFileSync('vercel.json', JSON.stringify(config, null, 2));
    logger.info('📝 Created vercel.json configuration');
  }

  private detectFramework(): string | undefined {
    try {
      if (existsSync('next.config.js') || existsSync('next.config.mjs')) {
        return 'nextjs';
      }
      if (existsSync('nuxt.config.js') || existsSync('nuxt.config.ts')) {
        return 'nuxtjs';
      }
      if (existsSync('vite.config.js') || existsSync('vite.config.ts')) {
        return 'vite';
      }
      if (existsSync('gatsby-config.js')) {
        return 'gatsby';
      }
      if (existsSync('svelte.config.js')) {
        return 'svelte-kit';
      }

      if (existsSync('package.json')) {
        const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        if (deps['next']) return 'nextjs';
        if (deps['@remix-run/react']) return 'remix';
        if (deps['astro']) return 'astro';
        if (deps['vue']) return 'vue';
        if (deps['react']) return 'create-react-app';
      }
    } catch {
      return undefined;
    }

    return undefined;
  }
}
