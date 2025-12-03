import { execSync } from 'child_process';
import { logger } from '../utils/logger.js';

export class CommitMessageGenerator {
    
    async generateCommitMessage(): Promise<string> {
        const spinner = logger.spinner('🤖 Analyzing code changes...');

        try {
            // Get git diff with file names
            const diff = execSync('git diff --cached --name-status', { encoding: 'utf-8' });

            if (!diff.trim()) {
                const unstagedDiff = execSync('git diff --name-status', { encoding: 'utf-8' });
                if (!unstagedDiff.trim()) {
                    spinner.stop();
                    return 'Update code';
                }
            }

            spinner.text = '✨ Generating commit message...';

            const commitMessage = this.analyzeChanges(diff);
            
            spinner.succeed('✅ Commit message generated');
            return commitMessage;

        } catch (error) {
            spinner.fail('Failed to generate commit message');
            return 'Update code';
        }
    }

    private analyzeChanges(diff: string): string {
        const lines = diff.trim().split('\n').filter(Boolean);
        
        if (lines.length === 0) {
            return 'chore: update code';
        }

        // Parse changes
        const added: string[] = [];
        const modified: string[] = [];
        const deleted: string[] = [];

        lines.forEach(line => {
            const [status, ...fileParts] = line.split('\t');
            const file = fileParts.join('\t');
            
            if (status.startsWith('A')) added.push(file);
            else if (status.startsWith('M')) modified.push(file);
            else if (status.startsWith('D')) deleted.push(file);
        });

        // Detect type of change based on files
        const type = this.detectCommitType(added, modified, deleted);
        const scope = this.detectScope(added, modified, deleted);
        const description = this.generateDescription(added, modified, deleted);

        // Build commit message
        if (scope) {
            return `${type}(${scope}): ${description}`;
        }
        return `${type}: ${description}`;
    }

    private detectCommitType(added: string[], modified: string[], deleted: string[]): string {
        const allFiles = [...added, ...modified, ...deleted];

        // Check for specific patterns
        if (allFiles.some(f => f.includes('test') || f.includes('.spec.') || f.includes('.test.'))) {
            return 'test';
        }

        if (allFiles.some(f => f.includes('README') || f.includes('.md'))) {
            return 'docs';
        }

        if (allFiles.some(f => f.includes('.css') || f.includes('.scss') || f.includes('style'))) {
            return 'style';
        }

        if (allFiles.some(f => f.includes('package.json') || f.includes('yarn.lock') || f.includes('pnpm-lock'))) {
            return 'chore';
        }

        if (allFiles.some(f => f.includes('.config') || f.includes('tsconfig') || f.includes('webpack'))) {
            return 'config';
        }

        // Check for new features (new files in src or lib)
        if (added.some(f => f.includes('/src/') || f.includes('/lib/') || f.includes('/components/'))) {
            return 'feat';
        }

        // Check for bug fixes (modified files with 'fix' or 'bug' in path)
        if (modified.some(f => f.toLowerCase().includes('fix') || f.toLowerCase().includes('bug'))) {
            return 'fix';
        }

        // Default based on operation
        if (added.length > 0 && modified.length === 0 && deleted.length === 0) {
            return 'feat';
        }

        if (deleted.length > 0) {
            return 'refactor';
        }

        return 'chore';
    }

    private detectScope(added: string[], modified: string[], deleted: string[]): string | null {
        const allFiles = [...added, ...modified, ...deleted];

        // Extract common directory or component
        const paths = allFiles.map(f => {
            const parts = f.split('/');
            if (parts.length > 2) {
                return parts[parts.length - 2]; // Parent directory
            }
            return null;
        }).filter(Boolean);

        if (paths.length === 0) return null;

        // Find most common path
        const pathCounts: Record<string, number> = {};
        paths.forEach(p => {
            if (p) pathCounts[p] = (pathCounts[p] || 0) + 1;
        });

        const mostCommon = Object.keys(pathCounts).reduce((a, b) => 
            pathCounts[a] > pathCounts[b] ? a : b
        );

        // Return scope if it's meaningful
        if (pathCounts[mostCommon] >= paths.length / 2) {
            return mostCommon;
        }

        return null;
    }

    private generateDescription(added: string[], modified: string[], deleted: string[]): string {
        const total = added.length + modified.length + deleted.length;

        // Single file change
        if (total === 1) {
            const file = [...added, ...modified, ...deleted][0];
            const fileName = file.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'file';
            
            if (added.length > 0) return `add ${fileName}`;
            if (deleted.length > 0) return `remove ${fileName}`;
            return `update ${fileName}`;
        }

        // Multiple files
        const parts: string[] = [];

        if (added.length > 0) {
            parts.push(`add ${added.length} file${added.length > 1 ? 's' : ''}`);
        }

        if (modified.length > 0) {
            parts.push(`update ${modified.length} file${modified.length > 1 ? 's' : ''}`);
        }

        if (deleted.length > 0) {
            parts.push(`remove ${deleted.length} file${deleted.length > 1 ? 's' : ''}`);
        }

        if (parts.length === 0) {
            return 'update code';
        }

        return parts.join(' and ');
    }

    async analyzeChangesStatus(): Promise<string> {
        try {
            const changes = execSync('git status --short', { encoding: 'utf-8' });
            return changes;
        } catch {
            return '';
        }
    }
}