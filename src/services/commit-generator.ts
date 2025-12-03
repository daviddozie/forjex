import OpenAI from 'openai';
import { execSync } from 'child_process';
import { logger } from '../utils/logger.js';

export class CommitMessageGenerator {
    private client: OpenAI;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY || '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';

        this.client = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: apiKey,
        });
    }

    async generateCommitMessage(): Promise<string> {
        const spinner = logger.spinner('🤖 Analyzing code changes...');

        try {
            // Get git diff
            const diff = execSync('git diff --cached', { encoding: 'utf-8' });

            if (!diff.trim()) {
                const unstagedDiff = execSync('git diff', { encoding: 'utf-8' });
                if (!unstagedDiff.trim()) {
                    spinner.stop();
                    return 'Update code';
                }
            }

            spinner.text = '✨ Generating commit message...';

            // Call OpenRouter model
            const response = await this.client.chat.completions.create({
                model: "google/gemini-2.0-flash",
                messages: [
                    {
                        role: "user",
                        content: `Analyze this git diff and generate a concise, clear commit message following conventional commits format (e.g., "feat:", "fix:", "docs:", etc.).

                        - Start with a type prefix
                        - Use present tense
                        - Clear and descriptive
                        - First line < 72 chars
                        - Return ONLY the commit message

                        Git diff:
                        ${diff.slice(0, 4000)}
`
                    }
                ],
                max_tokens: 200
            });

            const commitMessage =
                response.choices?.[0]?.message?.content?.trim() || 'Update code';

            spinner.succeed('✅ Commit message generated');
            return commitMessage;

        } catch (error) {
            spinner.fail('Failed to generate commit message');
            return this.generateSimpleCommitMessage();
        }
    }

    private generateSimpleCommitMessage(): string {
        try {
            const status = execSync('git status --short', { encoding: 'utf-8' });
            const lines = status.trim().split('\n').filter(Boolean);

            if (lines.length === 0) {
                return 'Update from Forjex';
            }

            const added = lines.filter(l => l.startsWith('A ')).length;
            const modified = lines.filter(l => l.startsWith('M ') || l.startsWith(' M')).length;
            const deleted = lines.filter(l => l.startsWith('D ')).length;

            const parts = [];
            if (added > 0) parts.push(`add ${added} file${added > 1 ? 's' : ''}`);
            if (modified > 0) parts.push(`update ${modified} file${modified > 1 ? 's' : ''}`);
            if (deleted > 0) parts.push(`delete ${deleted} file${deleted > 1 ? 's' : ''}`);

            return parts.length > 0 ? `chore: ${parts.join(', ')}` : 'Update from Forjex';
        } catch {
            return 'Update from Forjex';
        }
    }

    async analyzeChanges(): Promise<string> {
        try {
            const changes = execSync('git status --short', { encoding: 'utf-8' });
            return changes;
        } catch {
            return '';
        }
    }
}