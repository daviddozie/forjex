import simpleGit, { SimpleGit } from 'simple-git';
import { execSync } from 'child_process';
import { logger } from '../utils/logger.js';
import { writeFileSync, existsSync } from 'fs';
import { CommitMessageGenerator } from './commit-generator.js';
import chalk from 'chalk';
import type { ProjectConfig } from '../types/index.js';

export class GitService {
    private git: SimpleGit;
    private commitGenerator: CommitMessageGenerator;

    constructor(workingDir: string = process.cwd()) {
        this.git = simpleGit(workingDir);
        this.commitGenerator = new CommitMessageGenerator();
    }

    createLocalFiles(options: { readme?: boolean; gitignore?: string; license?: string }): void {
        const spinner = logger.spinner('📦 Creating project files...');

        if (options.readme && !existsSync('README.md')) {
            writeFileSync('README.md', '# Project\n\nCreated with Forjex CLI\n');
        }

        if (options.gitignore) {
            const templates: Record<string, string> = {
                Node: 'node_modules/\n.env\ndist/\n*.log\n',
                Python: '__pycache__/\n*.py[cod]\n.env\nvenv/\n',
                Java: '*.class\ntarget/\n.gradle/\nbuild/\n',
                Go: 'bin/\n*.exe\n.env\n',
                Rust: 'target/\nCargo.lock\n'
            };

            if (templates[options.gitignore] && !existsSync('.gitignore')) {
                writeFileSync('.gitignore', templates[options.gitignore]);
            }
        }

        spinner.succeed('📁 Project files created');
    }

    async runBuildCheck(projectConfig: ProjectConfig): Promise<void> {
        // Skip if no build command available
        if (!projectConfig.buildCommand || projectConfig.type === 'unknown') {
            logger.warn('⚠️  No build command detected — skipping build check');
            return;
        }

        const spinner = logger.spinner(`🔨 Running build check: ${chalk.cyan(projectConfig.buildCommand)}`);

        try {
            const output = execSync(projectConfig.buildCommand, {
                encoding: 'utf-8',
                stdio: 'pipe',
                // Merge stderr into output so we capture all error details
            });

            spinner.succeed(`Build passed — code is clean`);

            // Show last few lines of build output as confirmation
            const lines = output.trim().split('\n').filter(Boolean);
            if (lines.length > 0) {
                const preview = lines.slice(-3).join('\n');
                console.log(chalk.gray(`\n     ${preview.split('\n').join('\n     ')}\n`));
            }

        } catch (error: any) {
            spinner.fail('❌ Build failed — push aborted');

            console.log('\n');
            console.log(chalk.red('━'.repeat(50)));
            console.log(chalk.red.bold('  BUILD ERRORS'));
            console.log(chalk.red('━'.repeat(50)));

            // Combine stdout + stderr for full picture
            const rawOutput = [error.stdout, error.stderr]
                .filter(Boolean)
                .join('\n')
                .trim();

            if (rawOutput) {
                const lines = rawOutput.split('\n');

                lines.forEach((line: string) => {
                    // Highlight error lines red, warning lines yellow, rest gray
                    if (/error/i.test(line)) {
                        console.log(chalk.red(`  ${line}`));
                    } else if (/warning|warn/i.test(line)) {
                        console.log(chalk.yellow(`  ${line}`));
                    } else if (line.trim()) {
                        console.log(chalk.gray(`  ${line}`));
                    }
                });
            } else {
                console.log(chalk.red('  Build process exited with errors but produced no output.'));
                console.log(chalk.gray('  Try running the build command manually to investigate:'));
                console.log(chalk.cyan(`  ${projectConfig.buildCommand}`));
            }

            console.log(chalk.red('━'.repeat(50)));
            console.log('\n');
            console.log(chalk.yellow('  💡 Fix the errors above, then run ') + chalk.cyan('forjex forge') + chalk.yellow(' again.'));
            console.log('\n');

            // Throw so forge.ts can catch and exit cleanly
            throw new Error(`Build failed: fix errors before pushing to GitHub`);
        }
    }

    async initAndPush(repoUrl: string, isExistingRepo: boolean = false): Promise<void> {
        const spinner = logger.spinner('⚙️  Initializing git repository...');

        try {
            if (isExistingRepo) {
                const isRepo = await this.isGitRepository();

                if (!isRepo) {
                    spinner.text = '🔧 Initializing git...';
                    await this.git.init();

                    try {
                        await this.git.checkoutLocalBranch('main');
                    } catch {
                        await this.git.checkout('main');
                    }
                }

                spinner.text = '🔗 Setting up remote...';
                const remotes = await this.git.getRemotes(true);
                const hasOrigin = remotes.some(r => r.name === 'origin');

                if (hasOrigin) {
                    await this.git.removeRemote('origin');
                    await this.git.addRemote('origin', repoUrl);
                    logger.info('Updated remote origin');
                } else {
                    await this.git.addRemote('origin', repoUrl);
                    logger.info('Added remote origin');
                }

                spinner.text = '📁 Adding files...';
                await this.git.add('.');

                spinner.stop();

                const commitMessage = await this.commitGenerator.generateCommitMessage();

                console.log(chalk.gray('\n  📝 Commit message: ') + chalk.cyan(`"${commitMessage}"`));
                console.log('');

                spinner.start('💾 Creating commit...');
                await this.git.commit(commitMessage);

                spinner.text = '🚀 Pushing to GitHub...';

                try {
                    spinner.text = '⬇️  Pulling remote changes...';
                    await this.git.pull('origin', 'main', ['--rebase', '--allow-unrelated-histories']);
                } catch (pullError: any) {
                    if (!pullError.message.includes('couldn\'t find remote ref')) {
                        console.log(chalk.yellow('\n  ⚠️  Could not pull: ' + pullError.message));
                    }
                }

                spinner.text = '🚀 Pushing to GitHub...';
                await this.git.push('origin', 'main', ['--set-upstream']);

            } else {
                await this.git.init();
                try {
                    await this.git.branch();
                    const branches = await this.git.branchLocal();
                    if (!branches.all.includes('main')) {
                        await this.git.checkoutLocalBranch('main');
                    } else {
                        await this.git.checkout('main');
                    }
                } catch {
                    await this.git.checkoutLocalBranch('main');
                }

                spinner.text = '📁 Adding files...';
                await this.git.add('.');

                spinner.text = '💾 Creating initial commit...';
                await this.git.commit('Initial commit from Forjex');

                spinner.text = '🚀 Pushing to GitHub...';
                await this.git.addRemote('origin', repoUrl);
                await this.git.push('origin', 'main', ['--set-upstream']);
            }

            spinner.succeed('Code pushed to GitHub successfully!');
        } catch (error: any) {
            spinner.fail('Failed to push to GitHub');
            throw error;
        }
    }

    async isGitRepository(): Promise<boolean> {
        try {
            return existsSync('.git');
        } catch {
            return false;
        }
    }

    async getRemoteUrl(): Promise<string | null> {
        try {
            const remotes = await this.git.getRemotes(true);
            const origin = remotes.find(r => r.name === 'origin');
            return origin?.refs?.push || null;
        } catch {
            return null;
        }
    }
}