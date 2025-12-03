import 'dotenv/config'
import OpenAI from 'openai';
import { execSync } from 'child_process';
import { logger } from '../utils/logger.js';

export class CommitMessageGenerator {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENAI_API_KEY,
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
                    spinner.fail('No changes detected');
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
            return 'Update code';
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