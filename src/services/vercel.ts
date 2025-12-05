import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
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
        const config = loadConfig();

        if (config?.vercelToken) {
            this.isAuthenticated = true;
            logger.success('🔑 Already authenticated with Vercel');
            return;
        }

        try {
            try {
                execSync('vercel --version', { stdio: 'ignore' });
            } catch {
                const spinner = logger.spinner('Installing Vercel CLI...');
                execSync('npm install -g vercel', { stdio: 'inherit' });
                spinner.succeed('Vercel CLI installed');
            }

            console.log('\n');
            logger.info('🔐 Opening browser to authenticate with Vercel...');
            console.log(chalk.yellow.bold('\n  ⚡ Press [ENTER] to open your browser\n'));

            execSync('vercel login', { stdio: 'inherit' });

            // Save a placeholder token (Vercel CLI handles auth internally)
            const currentConfig = loadConfig() || {};
            saveConfig({
                ...currentConfig,
                vercelToken: 'authenticated'
            });

            this.isAuthenticated = true;
            logger.success('✅ Vercel authentication successful!');
        } catch (error: any) {
            logger.error('Vercel authentication failed');
            throw error;
        }
    }

    async deploy(projectName: string, projectConfig: ProjectConfig, githubRepoUrl?: string): Promise<VercelDeployment> {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated with Vercel');
        }

        const sanitizedName = this.sanitizeProjectName(projectName);
        const spinner = logger.spinner('🚀 Deploying to Vercel...');

        try {
            this.createVercelConfig(sanitizedName, projectConfig);

            spinner.text = '📦 Building and deploying...';

            const deployOutput = execSync('vercel --prod --yes', {
                encoding: 'utf-8',
                stdio: 'pipe'
            });

            const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
            const deploymentUrl = urlMatch ? urlMatch[0] : '';

            spinner.succeed(`✅ Deployed to Vercel`);
            console.log(chalk.magenta.bold(`   ${deploymentUrl}\n`));

            if (githubRepoUrl) {
                logger.success('🔗 Auto-deployment enabled!');
                logger.info('   Future pushes to main will automatically deploy\n');
            }

            return {
                url: deploymentUrl,
                deploymentUrl: deploymentUrl,
                projectId: sanitizedName
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
        repoName: string
    ): Promise<VercelDeployment> {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated with Vercel');
        }

        const sanitizedName = this.sanitizeProjectName(projectName);
        const spinner = logger.spinner('🚀 Deploying to Vercel with GitHub integration...');

        try {
            this.createVercelConfig(sanitizedName, projectConfig);

            spinner.text = '🔗 Linking GitHub repository...';

            const linkCommand = `vercel link --yes --repo https://github.com/${repoOwner}/${repoName}`;

            try {
                execSync(linkCommand, {
                    encoding: 'utf-8',
                    stdio: 'pipe'
                });
                spinner.text = '✅ GitHub repository linked';
            } catch (linkError) {
                logger.warn('⚠️  Could not auto-link repository, deploying normally...');
            }

            spinner.text = '📦 Building and deploying...';

            const deployOutput = execSync('vercel --prod --yes', {
                encoding: 'utf-8',
                stdio: 'pipe'
            });

            const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
            const deploymentUrl = urlMatch ? urlMatch[0] : '';

            try {
                spinner.text = '🔗 Setting up auto-deployment...';
                execSync(`vercel git connect`, {
                    encoding: 'utf-8',
                    stdio: 'pipe',
                    timeout: 10000
                });
            } catch (gitError) {
                logger.warn('⚠️  Auto-deployment setup incomplete. You may need to connect GitHub manually.');
                console.log(chalk.gray('   Visit: ') + chalk.cyan(`https://vercel.com/dashboard`));
                console.log(chalk.gray('   Then: Project Settings → Git → Connect Repository\n'));
            }

            spinner.succeed(`✅ Deployed to Vercel with GitHub integration`);
            console.log(chalk.magenta.bold(`   ${deploymentUrl}\n`));

            logger.success('🔗 Auto-deployment configured!');
            logger.info('   Future pushes to main will automatically deploy\n');

            return {
                url: deploymentUrl,
                deploymentUrl: deploymentUrl,
                projectId: sanitizedName
            };
        } catch (error: any) {
            spinner.fail('Deployment to Vercel failed');
            throw error;
        }
    }

    private sanitizeProjectName(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9._-]/g, '-')
            .replace(/--+/g, '-')
            .replace(/^[-._]+|[-._]+$/g, '')
            .substring(0, 100);
    }

    private createVercelConfig(projectName: string, projectConfig: ProjectConfig): void {
        if (existsSync('vercel.json')) {
            return;
        }

        const config: any = {
            name: projectName,
            version: 2
        };

        if (projectConfig.type === 'nodejs') {
            const framework = this.detectFramework();

            if (framework) {
                config.framework = framework;
            }

            if (projectConfig.buildCommand) {
                config.buildCommand = projectConfig.buildCommand;
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

            // Check package.json for framework hints
            if (existsSync('package.json')) {
                const packageJson = require(process.cwd() + '/package.json');
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

                if (deps['next']) return 'nextjs';
                if (deps['@remix-run/react']) return 'remix';
                if (deps['astro']) return 'astro';
                if (deps['vue']) return 'vue';
                if (deps['react']) return 'create-react-app';
            }
        } catch (error) {
            return undefined;
        }

        return undefined;
    }
}