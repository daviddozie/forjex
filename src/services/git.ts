import simpleGit, { SimpleGit } from 'simple-git';
import { logger } from '../utils/logger.js';
import { writeFileSync, existsSync } from 'fs';
import { CommitMessageGenerator } from './commit-generator.js';
import chalk from 'chalk';

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

            spinner.succeed('✅ Code pushed to GitHub successfully!');
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