import { execSync } from 'child_process';
import { logger } from '../utils/logger.js';

interface FileChange {
    file: string;
    added: string[];
    removed: string[];
    modified: string[];
}

export class CommitMessageGenerator {

    async generateCommitMessage(): Promise<string> {
        const spinner = logger.spinner('🤖 Analyzing code changes...');

        try {
            // Get detailed git diff
            const diff = execSync('git diff --cached', { encoding: 'utf-8' });

            if (!diff.trim()) {
                const unstagedDiff = execSync('git diff', { encoding: 'utf-8' });
                if (!unstagedDiff.trim()) {
                    spinner.stop();
                    return 'chore: update code';
                }
            }

            spinner.text = '✨ Analyzing changes...';

            const commitMessage = this.analyzeSpecificChanges(diff);

            spinner.succeed('✅ Commit message generated');
            return commitMessage;

        } catch (error) {
            spinner.fail('Failed to generate commit message');
            return 'chore: update code';
        }
    }

    private analyzeSpecificChanges(diff: string): string {
        const fileChanges = this.extractFileChanges(diff);

        if (fileChanges.length === 0) {
            return 'chore: update code';
        }

        // Get the most significant change
        const primaryChange = fileChanges[0];
        const fileName = primaryChange.file.split('/').pop() || primaryChange.file;

        // Build specific description
        const type = this.detectCommitType(primaryChange);
        const description = this.buildSpecificDescription(primaryChange, fileName);

        return `${type}: ${description}`;
    }

    private extractFileChanges(diff: string): FileChange[] {
        const fileChanges: FileChange[] = [];
        const lines = diff.split('\n');

        let currentFile = '';
        let currentChange: FileChange = { file: '', added: [], removed: [], modified: [] };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Detect file header
            const fileMatch = line.match(/^\+\+\+ b\/(.+)$/);
            if (fileMatch) {
                if (currentFile && currentChange.file) {
                    fileChanges.push({ ...currentChange });
                }
                currentFile = fileMatch[1];
                currentChange = { file: currentFile, added: [], removed: [], modified: [] };
                continue;
            }

            if (!currentFile) continue;

            // Analyze added lines
            if (line.startsWith('+') && !line.startsWith('+++')) {
                const content = line.substring(1).trim();

                // Skip empty lines
                if (!content) continue;

                // Detect what was added
                if (content.includes('<button') || content.includes('Button')) {
                    currentChange.added.push('button');
                } else if (content.includes('<input') || content.includes('Input')) {
                    currentChange.added.push('input field');
                } else if (content.includes('<form') || content.includes('Form')) {
                    currentChange.added.push('form');
                } else if (content.match(/function\s+\w+|const\s+\w+\s*=.*=>|async.*function/)) {
                    const funcMatch = content.match(/function\s+(\w+)|const\s+(\w+)\s*=/);
                    const funcName = funcMatch ? (funcMatch[1] || funcMatch[2]) : 'function';
                    currentChange.added.push(funcName);
                } else if (content.match(/class\s+(\w+)/)) {
                    const className = content.match(/class\s+(\w+)/)?.[1];
                    currentChange.added.push(`${className} class`);
                } else if (content.match(/import.*from/)) {
                    const importMatch = content.match(/from\s+['"]([^'"]+)['"]/);
                    const moduleName = importMatch?.[1]?.split('/').pop() || 'dependency';
                    currentChange.added.push(`${moduleName} import`);
                } else if (content.match(/<[A-Z]\w+/)) {
                    const componentMatch = content.match(/<([A-Z]\w+)/);
                    currentChange.added.push(`${componentMatch?.[1]} component`);
                } else if (content.includes('useState') || content.includes('useEffect')) {
                    const hookMatch = content.match(/use\w+/);
                    currentChange.added.push(`${hookMatch?.[0]} hook`);
                } else if (content.length > 10 && !content.startsWith('//') && !content.startsWith('/*')) {
                    // Generic text content
                    const preview = content.substring(0, 30).replace(/[^\w\s]/g, '').trim();
                    if (preview) {
                        currentChange.added.push('content');
                    }
                }
            }

            // Analyze removed lines
            if (line.startsWith('-') && !line.startsWith('---')) {
                const content = line.substring(1).trim();

                if (!content) continue;

                if (content.includes('<button') || content.includes('Button')) {
                    currentChange.removed.push('button');
                } else if (content.match(/function\s+\w+|const\s+\w+\s*=/)) {
                    const funcMatch = content.match(/function\s+(\w+)|const\s+(\w+)\s*=/);
                    const funcName = funcMatch ? (funcMatch[1] || funcMatch[2]) : 'function';
                    currentChange.removed.push(funcName);
                } else if (content.length > 10 && !content.startsWith('//')) {
                    currentChange.removed.push('code');
                }
            }
        }

        // Add last file
        if (currentFile && currentChange.file) {
            fileChanges.push(currentChange);
        }

        return fileChanges;
    }

    private detectCommitType(change: FileChange): string {
        const { file, added, removed } = change;

        // Documentation
        if (file.endsWith('.md') || file.includes('README')) {
            return 'docs';
        }

        // Tests
        if (file.includes('test') || file.includes('.spec.') || file.includes('.test.')) {
            return 'test';
        }

        // Styles
        if (file.endsWith('.css') || file.endsWith('.scss') || file.includes('style')) {
            return 'style';
        }

        // Configuration
        if (file.includes('config') || file === 'package.json') {
            return 'chore';
        }

        // New feature (more additions than removals)
        if (added.length > removed.length && added.length > 2) {
            return 'feat';
        }

        // Bug fix
        if (file.toLowerCase().includes('fix') || file.toLowerCase().includes('bug')) {
            return 'fix';
        }

        // Refactor (more removals)
        if (removed.length > added.length) {
            return 'refactor';
        }

        // Default
        return 'chore';
    }

    private buildSpecificDescription(change: FileChange, fileName: string): string {
        const { added, removed } = change;

        // Prioritize most specific changes
        const parts: string[] = [];

        // Handle additions
        if (added.length > 0) {
            const uniqueAdded = [...new Set(added)];

            if (uniqueAdded.length === 1) {
                parts.push(`add ${uniqueAdded[0]} to ${fileName}`);
            } else if (uniqueAdded.length === 2) {
                parts.push(`add ${uniqueAdded[0]} and ${uniqueAdded[1]} to ${fileName}`);
            } else {
                // Group similar items
                const items = uniqueAdded.slice(0, 2).join(', ');
                parts.push(`add ${items} to ${fileName}`);
            }
        }

        // Handle removals
        if (removed.length > 0) {
            const uniqueRemoved = [...new Set(removed)];

            if (uniqueRemoved.length === 1) {
                if (parts.length > 0) {
                    parts.push(`remove ${uniqueRemoved[0]}`);
                } else {
                    parts.push(`remove ${uniqueRemoved[0]} from ${fileName}`);
                }
            } else {
                if (parts.length > 0) {
                    parts.push(`remove ${uniqueRemoved.length} items`);
                } else {
                    parts.push(`remove ${uniqueRemoved.length} items from ${fileName}`);
                }
            }
        }

        // Handle modifications (when both added and removed)
        if (added.length > 0 && removed.length > 0 && parts.length === 0) {
            parts.push(`update ${fileName}`);
        }

        // Fallback
        if (parts.length === 0) {
            if (added.length > 0) {
                parts.push(`update ${fileName}`);
            } else if (removed.length > 0) {
                parts.push(`clean up ${fileName}`);
            } else {
                parts.push(`modify ${fileName}`);
            }
        }

        return parts.join(' and ');
    }
}