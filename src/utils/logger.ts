import chalk from 'chalk';
import ora, { Ora } from 'ora';

export const logger = {
    info: (msg: string) => console.log(chalk.blue('ℹ'), msg),
    success: (msg: string) => console.log(chalk.green('✔'), msg),
    error: (msg: string) => console.log(chalk.red('✖'), msg),
    warn: (msg: string) => console.log(chalk.yellow('⚠'), msg),
    spinner: (text: string): Ora => ora(text).start()
};