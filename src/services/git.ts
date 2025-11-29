import simpleGit, { SimpleGit } from 'simple-git';
import { logger } from '../utils/logger.js';

export class GitService {
    private git: SimpleGit;

    constructor(workingDir: string = process.cwd()) {
        this.git = simpleGit(workingDir);
    }

    async initAndPush(repoUrl: string): Promise<void> {
        const spinner = logger.spinner('Initializing git repository...');

        try {
            await this.git.init();
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