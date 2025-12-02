import { execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { logger } from '../utils/logger.js';
import { saveConfig, loadConfig } from '../utils/config.js';
import type { ProjectConfig, VercelDeployment } from '../types/index.js';
import chalk from 'chalk';

export class VercelService {
    private isAuthenticated: boolean = false;

    async authenticate(): Promise<void> {
        const config = loadConfig();

        if (config?.vercelToken) {
            this.isAuthenticated = true;
            logger.success('🔑 Already authenticated with Vercel');
            return;
        }

        try {
            // Check if Vercel CLI is installed
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

            // Login with Vercel CLI (opens browser)
            execSync('vercel login', { stdio: 'inherit' });

            // Save a placeholder token (Vercel CLI handles auth internally)
            const currentConfig = loadConfig() || {};
            saveConfig({
                ...currentConfig,
                vercelToken: 'authenticated' // Just mark as authenticated
            });

            this.isAuthenticated = true;
            logger.success('✅ Vercel authentication successful!');
        } catch (error: any) {
            logger.error('Vercel authentication failed');
            throw error;
        }
    }

    async deploy(projectName: string, projectConfig: ProjectConfig): Promise<VercelDeployment> {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated with Vercel');
        }

        const spinner = logger.spinner('🚀 Deploying to Vercel...');

        try {
            // Create vercel.json config
            this.createVercelConfig(projectName, projectConfig);

            spinner.text = '📦 Building project...';

            // Deploy to Vercel (CLI is already authenticated)
            const deployOutput = execSync(
                'vercel --prod --yes',  // Removed --token flag
                {
                    encoding: 'utf-8',
                    stdio: 'pipe'
                }
            );

            // Extract deployment URL from output
            const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
            const deploymentUrl = urlMatch ? urlMatch[0] : '';

            spinner.succeed(`✅ Deployed to Vercel`);
            console.log(chalk.magenta.bold(`   ${deploymentUrl}\n`));

            return {
                url: deploymentUrl,
                deploymentUrl: deploymentUrl,
                projectId: projectName
            };
        } catch (error: any) {
            spinner.fail('Deployment to Vercel failed');
            throw error;
        }
    }

    private createVercelConfig(projectName: string, projectConfig: ProjectConfig): void {
        if (existsSync('vercel.json')) {
            return; // Don't overwrite existing config
        }

        const config: any = {
            name: projectName,
            version: 2
        };

        // Auto-detect framework and add settings
        if (projectConfig.type === 'nodejs') {
            const framework = this.detectFramework();

            if (framework) {
                config.framework = framework;
            }

            // Add build settings if needed
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

    async addVercelToGitHubActions(repoUrl: string): Promise<void> {
        const spinner = logger.spinner('⚙️  Adding Vercel deployment to CI/CD...');

        try {
            const workflowPath = '.github/workflows/ci.yml';

            if (!existsSync(workflowPath)) {
                spinner.warn('No CI/CD workflow found, skipping Vercel integration');
                return;
            }

            // Read existing workflow - use the imports from top of file
            let workflow = readFileSync(workflowPath, 'utf-8');

            // Add Vercel deployment job
            const vercelJob = `

  deploy-to-vercel:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: 📦 Checkout code
      uses: actions/checkout@v4

    - name: 🚀 Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: \${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
`;

            // Append Vercel job to workflow
            workflow += vercelJob;
            writeFileSync(workflowPath, workflow);

            spinner.succeed('✅ Vercel deployment added to CI/CD');

            console.log('\n');
            logger.warn('⚠️  Important: Add these secrets to your GitHub repository:');
            logger.info('   1. VERCEL_TOKEN - Your Vercel token');
            logger.info('   2. VERCEL_ORG_ID - Your Vercel organization ID');
            logger.info('   3. VERCEL_PROJECT_ID - Your Vercel project ID');
            logger.info('\n   Get these from: https://vercel.com/account/tokens');
            console.log('\n');
        } catch (error: any) {
            spinner.fail('Failed to add Vercel to CI/CD');
            throw error;
        }
    }
}