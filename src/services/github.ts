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

        const spinner = logger.spinner('⏳Authenticating with GitHub...');

        try {
            const auth = createOAuthDeviceAuth({
                clientType: 'oauth-app',
                clientId: CLIENT_ID,
                scopes: ['repo', 'workflow'],
                onVerification: async (verification) => {
                    spinner.stop();
                    console.log('\n');
                    logger.info(`Opening browser to: ${chalk.cyan(verification.verification_uri)}`);
                    logger.info(`Enter code: ${chalk.bold.yellow(verification.user_code)}`);
                    console.log('\n');

                    await open(verification.verification_uri);
                    spinner.start('🔄 Waiting for authorization...');
                }
            });

            const { token } = await auth({ type: 'oauth' });

            saveConfig({
                token,
                expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000)
            });

            this.octokit = new Octokit({ auth: token });
            spinner.succeed('Authentication successful!');
        } catch (error) {
            spinner.fail('Authentication failed');
            throw error;
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