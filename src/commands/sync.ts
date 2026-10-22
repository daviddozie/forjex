import chalk from 'chalk';
import { CloudSyncService } from '../services/cloud-sync.js';
import { getCloudUrl, loadConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';

export async function syncCommand(): Promise<void> {
    console.log('\n');
    console.log(chalk.cyan.bold('  🔄 FORJEX CLOUD SYNC'));
    console.log(chalk.gray('  ━'.repeat(25)));
    console.log('\n');

    const spinner = logger.spinner('Fetching synced projects from Forjex Cloud...');
    const cloudSync = new CloudSyncService();

    try {
        const { dbConnected, projects, error } = await cloudSync.getProjects();
        spinner.stop();

        if (error) {
            logger.warn(`Could not reach Cloud Dashboard at ${getCloudUrl()}: ${error}`);
            console.log(chalk.gray('\nMake sure your web server is running: ') + chalk.yellow('pnpm dev --port 3000\n'));
            return;
        }

        console.log(chalk.gray('  Cloud Dashboard: ') + chalk.blue(getCloudUrl()));
        console.log(
            chalk.gray('  Cloud Sync:      ') +
                (dbConnected
                    ? chalk.green('✓ Database connected')
                    : chalk.yellow('Database unavailable'))
        );
        console.log('\n');

        if (!projects || projects.length === 0) {
            console.log(chalk.yellow('  No projects found in your cloud account yet.'));
            console.log(chalk.gray('  Forge a new project using: ') + chalk.yellow.bold('forjex forge') + chalk.gray(' or visit ') + chalk.cyan(`${getCloudUrl()}/forge\n`));
            return;
        }

        console.log(chalk.bold.white(`  Synced Projects (${projects.length}):\n`));

        for (const proj of projects) {
            const isLiveBadge = proj.isLive ? chalk.green('[Live GitHub]') : chalk.gray('[Demo]');
            console.log(`  ${chalk.cyan.bold('●')} ${chalk.bold(proj.name)} ${isLiveBadge}`);
            console.log(`    ${chalk.gray('Framework:')}  ${proj.framework || 'Web App'}`);
            console.log(`    ${chalk.gray('Repository:')} https://github.com/${proj.repo}`);
            if (proj.deploymentUrl) {
                console.log(`    ${chalk.gray('Deployment:')} ${chalk.magenta(proj.deploymentUrl)}`);
            }
            console.log(`    ${chalk.gray('Status:')}      ${chalk.cyan((proj.status || 'unknown').replaceAll('_', ' '))}  •  Branch: ${proj.branch || 'main'}`);
            console.log(chalk.gray('    ' + '─'.repeat(45)));
        }

        console.log('\n' + chalk.gray('  Manage projects online at: ') + chalk.cyan.underline(`${getCloudUrl()}/dashboard\n`));
    } catch (err: any) {
        spinner.fail('Failed to synchronize with Forjex Cloud');
        console.error(err.message || err);
    }
}
