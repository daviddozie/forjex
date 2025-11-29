import simpleGit, { SimpleGit } from 'simple-git';
import { logger } from '../utils/logger.js';
import { writeFileSync, existsSync } from 'fs';

export class GitService {
    private git: SimpleGit;

    constructor(workingDir: string = process.cwd()) {
        this.git = simpleGit(workingDir);
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

    async initAndPush(repoUrl: string): Promise<void> {
        const spinner = logger.spinner('Initializing git repository...');

        try {
            await this.git.init();
            await this.git.checkoutLocalBranch('main');
            spinner.text = 'Adding files...';

            await this.git.add('.');
            spinner.text = 'Creating initial commit...';

            await this.git.commit('Initial commit from Forjex');
            spinner.text = 'Pushing to GitHub...';

            await this.git.addRemote('origin', repoUrl);
            await this.git.push('origin', 'main', ['--set-upstream']);

            spinner.succeed('Code pushed to GitHub successfully!');
        } catch (error: any) {
            spinner.fail('Failed to push to GitHub');
            throw error;
        }
    }

    async isGitRepository(): Promise<boolean> {
        try {
            await this.git.status();
            return true;
        } catch {
            return false;
        }
    }
}