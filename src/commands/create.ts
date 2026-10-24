import inquirer from 'inquirer';
import chalk from 'chalk';
import {
  STARTERS,
  createStarter,
  getStarterCommands,
  installStarter,
  normalizeTemplate,
  validateProjectName,
} from '../services/starter.js';

export interface StarterOptions {
  template?: string;
  install?: boolean;
  ci?: boolean;
  vercel?: boolean;
  setup?: boolean;
  ai?: boolean;
}

export async function createCommand(
  name?: string,
  options: StarterOptions = {},
): Promise<{ directory: string; template: string }> {
  if (name && validateProjectName(name) !== true)
    throw new Error(String(validateProjectName(name)));
  if (options.template) normalizeTemplate(options.template);
  const projectName =
    name ||
    (
      await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Project name:',
          default: 'my-app',
          validate: validateProjectName,
        },
      ])
    ).name;
  const template = normalizeTemplate(
    options.template ||
      (
        await inquirer.prompt([
          {
            type: 'rawlist',
            name: 'template',
            message: 'Choose your starter:',
            choices: [...STARTERS],
          },
        ])
      ).template,
  );
  const directory = createStarter(projectName, template);
  console.log(chalk.green(`\nCreated ${projectName} in ${directory}\n`));
  let installed = false;
  if (['nextjs', 'react', 'vue'].includes(template) && options.install !== false) {
    const { install } = await inquirer.prompt([
      { type: 'confirm', name: 'install', message: 'Install dependencies now?', default: true },
    ]);
    if (install) {
      await installStarter(directory);
      installed = true;
    }
  }
  console.log('Start your application:\n');
  console.log(chalk.cyan(`  cd ${projectName}`));
  for (const command of getStarterCommands(template)) {
    if (installed && command === 'npm install') continue;
    console.log(chalk.cyan(`  ${command}`));
  }
  return { directory, template };
}

export async function createAndSetupCommand(name?: string, options: StarterOptions = {}) {
  const starter = await createCommand(name, options);
  if (options.setup !== false && process.stdin.isTTY) {
    const { continueSetup } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continueSetup',
        message: 'Continue with GitHub, optional CI/CD, and deployment?',
        default: true,
      },
    ]);
    if (continueSetup) {
      const { forgeCommand } = await import('./forge.js');
      await forgeCommand(undefined, options, starter);
      return;
    }
  }
  console.log(
    '\nYour local project is ready. Run forjex forge inside it to connect GitHub, CI/CD, and deployment later.\n',
  );
}
