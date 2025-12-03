import { execSync } from 'child_process';
import { logger } from '../utils/logger.js';

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

            // Also get file names with status
            const fileStatus = execSync('git diff --cached --name-status', { encoding: 'utf-8' });

            spinner.text = '✨ Analyzing changes...';

            const commitMessage = this.analyzeDetailedChanges(diff, fileStatus);

            spinner.succeed('✅ Commit message generated');
            return commitMessage;

        } catch (error) {
            spinner.fail('Failed to generate commit message');
            return 'chore: update code';
        }
    }

    private analyzeDetailedChanges(diff: string, fileStatus: string): string {
        const files = this.parseFileStatus(fileStatus);
        const changes = this.extractKeyChanges(diff);

        // Detect type and build message
        const type = this.detectCommitType(files, changes);
        const description = this.buildDescription(files, changes);

        return `${type}: ${description}`;
    }

    private parseFileStatus(fileStatus: string): { added: string[], modified: string[], deleted: string[] } {
        const lines = fileStatus.trim().split('\n').filter(Boolean);
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

        return { added, modified, deleted };
    }

    private extractKeyChanges(diff: string): {
        functionsAdded: string[],
        functionsModified: string[],
        functionsDeleted: string[],
        importsAdded: string[],
        exportsAdded: string[],
        classesAdded: string[],
        componentsAdded: string[],
        addedLines: number,
        deletedLines: number
    } {
        const functionsAdded: string[] = [];
        const functionsModified: string[] = [];
        const functionsDeleted: string[] = [];
        const importsAdded: string[] = [];
        const exportsAdded: string[] = [];
        const classesAdded: string[] = [];
        const componentsAdded: string[] = [];

        let addedLines = 0;
        let deletedLines = 0;

        const lines = diff.split('\n');

        lines.forEach((line, index) => {
            // Count line changes
            if (line.startsWith('+') && !line.startsWith('+++')) addedLines++;
            if (line.startsWith('-') && !line.startsWith('---')) deletedLines++;

            // Detect added functions
            if (line.startsWith('+')) {
                // JavaScript/TypeScript functions
                const funcMatch = line.match(/\+\s*(async\s+)?function\s+(\w+)|const\s+(\w+)\s*=\s*(\(.*?\)|async)/);
                if (funcMatch) {
                    const funcName = funcMatch[2] || funcMatch[3];
                    if (funcName) functionsAdded.push(funcName);
                }

                // Class methods
                const methodMatch = line.match(/\+\s*(async\s+)?(\w+)\s*\([^)]*\)\s*{/);
                if (methodMatch && !line.includes('function')) {
                    functionsAdded.push(methodMatch[2]);
                }

                // Arrow functions
                const arrowMatch = line.match(/\+\s*const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/);
                if (arrowMatch) {
                    functionsAdded.push(arrowMatch[1]);
                }

                // Imports
                const importMatch = line.match(/\+\s*import\s+.*from\s+['"]([^'"]+)['"]/);
                if (importMatch) {
                    importsAdded.push(importMatch[1]);
                }

                // Exports
                const exportMatch = line.match(/\+\s*export\s+(class|function|const)\s+(\w+)/);
                if (exportMatch) {
                    exportsAdded.push(exportMatch[2]);
                }

                // Classes
                const classMatch = line.match(/\+\s*(export\s+)?(class|interface)\s+(\w+)/);
                if (classMatch) {
                    classesAdded.push(classMatch[3]);
                }

                // React components
                const componentMatch = line.match(/\+\s*(export\s+)?(const|function)\s+([A-Z]\w+)\s*=|<([A-Z]\w+)/);
                if (componentMatch) {
                    const compName = componentMatch[3] || componentMatch[4];
                    if (compName) componentsAdded.push(compName);
                }
            }

            // Detect deleted functions
            if (line.startsWith('-')) {
                const funcMatch = line.match(/-\s*(async\s+)?function\s+(\w+)|const\s+(\w+)\s*=/);
                if (funcMatch) {
                    const funcName = funcMatch[2] || funcMatch[3];
                    if (funcName) functionsDeleted.push(funcName);
                }
            }
        });

        return {
            functionsAdded: [...new Set(functionsAdded)],
            functionsModified: [],
            functionsDeleted: [...new Set(functionsDeleted)],
            importsAdded: [...new Set(importsAdded)],
            exportsAdded: [...new Set(exportsAdded)],
            classesAdded: [...new Set(classesAdded)],
            componentsAdded: [...new Set(componentsAdded)],
            addedLines,
            deletedLines
        };
    }

    private detectCommitType(
        files: { added: string[], modified: string[], deleted: string[] },
        changes: any
    ): string {
        const allFiles = [...files.added, ...files.modified, ...files.deleted];

        // Documentation
        if (allFiles.some(f => f.includes('README') || f.endsWith('.md'))) {
            return 'docs';
        }

        // Tests
        if (allFiles.some(f => f.includes('test') || f.includes('.spec.') || f.includes('.test.'))) {
            return 'test';
        }

        // Styles
        if (allFiles.some(f => f.endsWith('.css') || f.endsWith('.scss') || f.includes('style'))) {
            return 'style';
        }

        // Configuration
        if (allFiles.some(f => f.includes('config') || f.includes('package.json'))) {
            return 'chore';
        }

        // New features (new functions, classes, components)
        if (changes.functionsAdded.length > 0 ||
            changes.classesAdded.length > 0 ||
            changes.componentsAdded.length > 0 ||
            files.added.length > 0) {
            return 'feat';
        }

        // Bug fixes (look for fix/bug keywords in file names or significant deletions)
        if (allFiles.some(f => f.toLowerCase().includes('fix') || f.toLowerCase().includes('bug')) ||
            (changes.deletedLines > changes.addedLines && changes.addedLines > 0)) {
            return 'fix';
        }

        // Refactoring (mostly deletions)
        if (changes.deletedLines > changes.addedLines * 2) {
            return 'refactor';
        }

        // Default to chore for general updates
        return 'chore';
    }

    private buildDescription(
        files: { added: string[], modified: string[], deleted: string[] },
        changes: any
    ): string {
        const parts: string[] = [];

        // Describe specific code changes
        if (changes.componentsAdded.length > 0) {
            const components = changes.componentsAdded.slice(0, 2).join(', ');
            parts.push(`add ${components} component${changes.componentsAdded.length > 1 ? 's' : ''}`);
        } else if (changes.classesAdded.length > 0) {
            const classes = changes.classesAdded.slice(0, 2).join(', ');
            parts.push(`add ${classes} class${changes.classesAdded.length > 1 ? 'es' : ''}`);
        } else if (changes.functionsAdded.length > 0) {
            const funcs = changes.functionsAdded.slice(0, 2).join(', ');
            parts.push(`add ${funcs} function${changes.functionsAdded.length > 1 ? 's' : ''}`);
        }

        if (changes.functionsDeleted.length > 0) {
            parts.push(`remove ${changes.functionsDeleted.length} function${changes.functionsDeleted.length > 1 ? 's' : ''}`);
        }

        if (changes.importsAdded.length > 0 && parts.length === 0) {
            const imports = changes.importsAdded.slice(0, 2).map((i:string) => i.split('/').pop()).join(', ');
            parts.push(`add ${imports} import${changes.importsAdded.length > 1 ? 's' : ''}`);
        }

        // If no specific code changes detected, describe file changes
        if (parts.length === 0) {
            if (files.added.length > 0) {
                const fileName = files.added[0].split('/').pop()?.replace(/\.[^/.]+$/, '');
                if (files.added.length === 1) {
                    parts.push(`add ${fileName}`);
                } else {
                    parts.push(`add ${files.added.length} files`);
                }
            }

            if (files.modified.length > 0) {
                const fileName = files.modified[0].split('/').pop()?.replace(/\.[^/.]+$/, '');
                if (files.modified.length === 1) {
                    parts.push(`update ${fileName}`);
                } else {
                    parts.push(`update ${files.modified.length} files`);
                }
            }

            if (files.deleted.length > 0) {
                parts.push(`remove ${files.deleted.length} file${files.deleted.length > 1 ? 's' : ''}`);
            }
        }

        return parts.length > 0 ? parts.join(' and ') : 'update code';
    }
}