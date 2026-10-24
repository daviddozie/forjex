import { resolveAIConfig } from '../utils/ai-config.js';
import simpleGit from 'simple-git';
import inquirer from 'inquirer';
import { logger } from '../utils/logger.js';
import {
  generateAICommitMessage,
  isSensitivePath,
  validateCommitMessage,
  type CommitChange,
} from '../ai/commit-message.js';

export interface CommitOptions {
  ai?: boolean;
  message?: string;
}

export async function stagedChanges(directory = process.cwd()): Promise<CommitChange[]> {
  const git = simpleGit(directory);
  const names = (await git.raw(['diff', '--cached', '--name-only', '-z']))
    .split('\0')
    .filter(Boolean);
  return Promise.all(
    names.map(async (path) => {
      if (isSensitivePath(path)) return { path, content: '' };
      const content = await git.raw([
        'diff',
        '--cached',
        '--no-ext-diff',
        '--no-textconv',
        '--no-renames',
        '--',
        path,
      ]);
      return {
        path,
        content,
        binary: content.includes('Binary files ') || content.includes('GIT binary patch'),
      };
    }),
  );
}

export class CommitMessageGenerator {
  constructor(private directory = process.cwd()) {}

  async generateCommitMessage(options: CommitOptions = {}): Promise<string> {
    if (options.message !== undefined) return validateCommitMessage(options.message);
    if (!process.stdin.isTTY) throw new Error('Use --message for a non-interactive commit.');
    const git = simpleGit(this.directory);
    const reviewedTree = await git.raw(['write-tree']);
    const changes = await stagedChanges(this.directory);
    let message = `chore: update ${changes.length} file${changes.length === 1 ? '' : 's'}`;
    const ai = resolveAIConfig();
    let useAI = Boolean(options.ai);
    if (!useAI && process.stdin.isTTY && ai.apiKey) {
      ({ useAI } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'useAI',
          message:
            'Generate an AI commit message with OpenAI? Filtered changes will be sent to OpenAI.',
          default: false,
        },
      ]));
    }
    if (useAI && !ai.apiKey)
      logger.info('Run forjex ai configure to set up your model and API key.');
    if (useAI) {
      logger.info(
        'AI sends bounded text changes to OpenAI; sensitive paths and recognized secrets are filtered. Review your changes for other confidential content.',
      );
      const spinner = logger.spinner('Generating commit message…');
      try {
        const result = await generateAICommitMessage(changes, {
          apiKey: ai.apiKey,
          model: ai.model,
        });
        message = result.message;
        spinner.succeed('Commit message generated');
        if (result.omitted.length)
          logger.info(`${result.omitted.length} file(s) excluded from the AI summary.`);
      } catch (error) {
        spinner.stop();
        logger.warn(
          error instanceof Error ? error.message : 'AI unavailable; enter a message manually.',
        );
      }
    }
    while (true) {
      console.log(`\nCommit message:\n${message}\n`);
      const { action } = await inquirer.prompt([
        {
          type: 'rawlist',
          name: 'action',
          message: 'Review commit message:',
          choices: [
            { name: 'Accept and continue', value: 'accept' },
            { name: 'Edit message', value: 'edit' },
            ...(useAI ? [{ name: 'Regenerate with AI', value: 'regenerate' }] : []),
            { name: 'Cancel', value: 'cancel' },
          ],
        },
      ]);
      if (action === 'accept') {
        if ((await git.raw(['write-tree'])) !== reviewedTree) {
          throw new Error(
            'Staged changes changed during review. Run the command again to review the current changes.',
          );
        }
        return validateCommitMessage(message);
      }
      if (action === 'cancel') throw new Error('Commit cancelled. Your changes are still staged.');
      if (action === 'regenerate') {
        try {
          message = (
            await generateAICommitMessage(changes, {
              apiKey: ai.apiKey,
              model: ai.model,
            })
          ).message;
        } catch (error) {
          logger.warn(error instanceof Error ? error.message : 'AI unavailable.');
        }
      } else {
        ({ message } = await inquirer.prompt([
          {
            type: 'editor',
            name: 'message',
            message: 'Commit message:',
            default: message,
            validate: (value: string) => {
              try {
                validateCommitMessage(value);
                return true;
              } catch {
                return 'A message is required (maximum 4000 characters).';
              }
            },
          },
        ]));
      }
    }
  }
}
