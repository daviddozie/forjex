import { Octokit } from '@octokit/rest';
import open from 'open';
import { createOAuthDeviceAuth } from '@octokit/auth-oauth-device';
import chalk from 'chalk';
import { logger } from '../utils/logger.js';
import { saveConfig, loadConfig, isTokenValid } from '../utils/config.js';
import type { RepoOptions } from '../types/index.js';

const CLIENT_ID = 'Ov23liRqj5mMaAS6fFiP';

export class GitHubService {
    private octokit: Octokit | null = null;

    async authenticate(): Promise<void> {
        const config = loadConfig();

        if (config && isTokenValid(config)) {
            this.octokit = new Octokit({ auth: config.token });
            logger.success('🔑 Already authenticated with GitHub');
            return;
        }

        const spinner = logger.spinner('⏳ Authenticating with GitHub...');

        try {
            const auth = createOAuthDeviceAuth({
                clientType: 'oauth-app',
                clientId: CLIENT_ID,
                scopes: ['repo', 'workflow', 'user:email'],
                onVerification: async (verification) => {
                    spinner.stop();
                    console.log('\n');
                    logger.info(`Please open: ${chalk.cyan(verification.verification_uri)}`);
                    logger.info(`Enter code: ${chalk.bold.yellow(verification.user_code)}`);
                    console.log('\n');

                    await open(verification.verification_uri);
                    spinner.start('⏳ Waiting for authorization...');
                }
            });

            const { token } = await auth({ type: 'oauth' });

            this.octokit = new Octokit({ auth: token });

            // Fetch user data
            const { data: user } = await this.octokit.users.getAuthenticated();

            // Save to local config
            saveConfig({
                token,
                expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000),
                user: {
                    name: user.name || user.login,
                    username: user.login,
                    avatar: user.avatar_url,
                    profileUrl: user.html_url
                }
            });

            // Send to web API
            await this.sendUserToAPI(user);

            spinner.succeed('✅ Authentication successful!');
        } catch (error) {
            spinner.fail('Authentication failed');
            throw error;
        }
    }

    private async sendUserToAPI(user: any): Promise<void> {
        try {
            console.log('Sending user data to API...'); // Debug log

            const response = await fetch('https://forjex-web.vercel.app/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: user.name || user.login,
                    username: user.login,
                    avatar: user.avatar_url,
                    profileUrl: user.html_url,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                console.error('API returned error:', response.status, response.statusText);
                return;
            }

            const data = await response.json();
            console.log('✅ User synced to dashboard:', data); // Success log

        } catch (error) {
            console.error('❌ Failed to sync with dashboard:', error);
        }
    }

    async createRepository(options: RepoOptions): Promise<string> {
        if (!this.octokit) throw new Error('Not authenticated');

        const spinner = logger.spinner(`Creating repository: ${options.name}`);

        try {
            const { data } = await this.octokit.repos.createForAuthenticatedUser({
                name: options.name,
                description: options.description,
                private: options.isPrivate,
                auto_init: false,
            });

            spinner.succeed(`Repository created: ${data.html_url}`);
            return data.clone_url;
        } catch (error: any) {
            spinner.fail('Failed to create repository');
            if (error.status === 422) {
                throw new Error('Repository name already exists');
            }
            throw error;
        }
    }
}