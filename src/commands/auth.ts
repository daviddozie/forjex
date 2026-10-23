import { randomBytes } from 'crypto';
import chalk from 'chalk';
import open from 'open';
import axios from 'axios';
import inquirer from 'inquirer';
import { logger } from '../utils/logger.js';
import { saveConfig, loadConfig, clearConfig, getCloudUrl } from '../utils/config.js';
import { CloudSyncService } from '../services/cloud-sync.js';

export async function loginCommand(options?: { token?: string }): Promise<void> {
  const cloudUrl = getCloudUrl();
  if (options?.token) {
    const { data: user } = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${options.token}` },
      timeout: 10000,
    });
    const existing = loadConfig();
    saveConfig({
      ...(existing?.user?.username === user.login ? existing : {}),
      githubToken: options.token,
      token: options.token,
      cloudUrl,
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      loggedInAt: new Date().toISOString(),
      user: {
        username: user.login,
        name: user.name || user.login,
        avatar: user.avatar_url,
        profileUrl: user.html_url,
      },
    });
    logger.success(`Authenticated as @${user.login}`);
    return;
  }
  const sessionId = randomBytes(32).toString('hex');
  const authUrl = `${cloudUrl}/auth/cli#session=${sessionId}`;
  logger.info(`Authorize your CLI in the browser:\n  ${authUrl}`);
  try {
    await open(authUrl);
  } catch {}
  const spinner = logger.spinner('Waiting for Forjex Cloud authorization...');
  const deadline = Date.now() + 180000;
  while (Date.now() < deadline) {
    try {
      const { data } = await axios.get(`${cloudUrl}/api/auth/cli`, {
        headers: { 'X-Forjex-CLI-Session': sessionId },
        timeout: 5000,
      });
      if (data.authorized && data.githubToken && data.user?.username) {
        saveConfig({
          githubToken: data.githubToken,
          token: data.githubToken,
          vercelToken: data.vercelToken,
          cloudUrl,
          loggedInAt: new Date().toISOString(),
          expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
          user: {
            username: data.user.username,
            name: data.user.name || data.user.username,
            avatar: data.user.avatarUrl || '',
            profileUrl: `https://github.com/${data.user.username}`,
          },
        });
        spinner.succeed(`Authenticated as @${data.user.username}`);
        return;
      }
    } catch (error: any) {
      if (error.response?.status === 503) {
        spinner.fail(
          'Cloud authorization storage is unavailable. Check the web server configuration.',
        );
        process.exitCode = 1;
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  spinner.fail('Authentication timed out. Run forjex login again.');
  process.exitCode = 1;
}

export async function whoamiCommand(): Promise<void> {
  console.log('\n');
  console.log(chalk.cyan.bold('  👤 FORJEX CLOUD IDENTITY'));
  console.log(chalk.gray('  ━'.repeat(25)));
  console.log('\n');

  const config = loadConfig();
  const token = config?.githubToken || config?.token;

  if (!token && !config?.user) {
    logger.info('Not currently logged in to Forjex Cloud.');
    console.log(chalk.gray('\n  To connect your CLI, run: ') + chalk.yellow.bold('forjex login\n'));
    return;
  }

  const cloudSync = new CloudSyncService();
  const dbHealth = await cloudSync.checkHealth();

  console.log(chalk.gray('  Account:'));
  if (config?.user?.username) {
    console.log(
      `     ${chalk.gray('GitHub User:')} ${chalk.green.bold('@' + config.user.username)}`,
    );
  }
  if (config?.user?.name) {
    console.log(`     ${chalk.gray('Name:')}        ${config.user.name}`);
  }

  console.log('\n' + chalk.gray('  Credentials:'));
  console.log(
    `     ${chalk.gray('GitHub Token:')} ${token ? chalk.green('✓ Connected') : chalk.red('✗ Missing')}`,
  );
  console.log(
    `     ${chalk.gray('Vercel Token:')} ${config?.vercelToken ? chalk.green('✓ Connected') : chalk.gray('– Optional (not set)')}`,
  );

  console.log('\n' + chalk.gray('  Cloud Integration:'));
  console.log(`     ${chalk.gray('Dashboard:')}    ${chalk.blue(getCloudUrl())}`);
  console.log(
    `     ${chalk.gray('Cloud Sync:')}   ${
      dbHealth.connected
        ? chalk.green('✓ Active')
        : chalk.yellow(`Unavailable (${dbHealth.status})`)
    }`,
  );

  if (config?.loggedInAt) {
    console.log(
      `     ${chalk.gray('Logged In:')}    ${new Date(config.loggedInAt).toLocaleString()}`,
    );
  }
  console.log('\n');
}

export async function logoutCommand(): Promise<void> {
  const config = loadConfig();
  if (!config?.token && !config?.githubToken && !config?.user) {
    logger.info('No active session found.');
    return;
  }

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to log out and clear stored CLI credentials?',
      default: true,
    },
  ]);

  if (confirm) {
    clearConfig();
    logger.success('✅ Successfully logged out. Credentials removed from ~/.forjex/config.json\n');
  } else {
    console.log(chalk.gray('Logout cancelled.\n'));
  }
}
