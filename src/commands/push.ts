import simpleGit from 'simple-git';
import inquirer from 'inquirer';
import { CommitMessageGenerator, type CommitOptions } from '../services/commit-generator.js';

export async function pushCommand(options: CommitOptions = {}): Promise<void> {
  const git = simpleGit();
  if (!(await git.checkIsRepo())) throw new Error('Run forjex push inside a Git repository.');
  let branch: string;
  try {
    branch = (await git.raw(['symbolic-ref', '--quiet', '--short', 'HEAD'])).trim();
  } catch {
    throw new Error('Check out a branch before pushing.');
  }
  if (!branch || branch === 'HEAD') throw new Error('Check out a branch before pushing.');
  const remote = (await git.getRemotes()).some((item) => item.name === 'origin');
  if (!remote) throw new Error('No origin remote. Run forjex forge to connect GitHub first.');
  console.log(await git.raw(['status', '--short']));
  let staged = (await git.diff(['--cached', '--name-only'])).trim();
  const status = await git.status();
  if (!staged && !status.isClean()) {
    if (!process.stdin.isTTY)
      throw new Error('Stage the files you want to commit before running non-interactively.');
    const { stage } = await inquirer.prompt([
      { type: 'confirm', name: 'stage', message: 'Stage all changes shown above?', default: false },
    ]);
    if (!stage) return;
    await git.add('.');
    staged = (await git.diff(['--cached', '--name-only'])).trim();
  }
  if (staged) {
    const message = await new CommitMessageGenerator().generateCommitMessage(options);
    await git.commit(message);
  }
  if (process.stdin.isTTY) {
    const { push } = await inquirer.prompt([
      { type: 'confirm', name: 'push', message: `Push ${branch} to origin?`, default: true },
    ]);
    if (!push) return;
  }
  await git.push('origin', branch, ['--set-upstream']);
  console.log(`Pushed ${branch} to origin.`);
}
