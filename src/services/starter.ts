import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { getTemplateFiles, getGitignoreContent, getReadmeContent } from '../templates/content.js';

export const STARTERS = [
  { value: 'nextjs', name: 'Next.js — App Router + React + TypeScript' },
  { value: 'react', name: 'React — Vite + TypeScript' },
  { value: 'vue', name: 'Vue — Vite + TypeScript' },
  { value: 'python', name: 'Python — FastAPI' },
  { value: 'go', name: 'Go — HTTP API' },
  { value: 'rust', name: 'Rust — Cargo application' },
] as const;

export function normalizeTemplate(template: string): string {
  const aliases: Record<string, string> = {
    'vite-react': 'react',
    'python-fastapi': 'python',
    'go-api': 'go',
    'rust-app': 'rust',
  };
  const value = aliases[template] || template;
  if (!STARTERS.some((starter) => starter.value === value)) {
    throw new Error(
      `Unknown template "${template}". Choose: ${STARTERS.map((s) => s.value).join(', ')}.`,
    );
  }
  return value;
}

export function validateProjectName(name: string): true | string {
  return /^[a-z][a-z0-9-]{0,63}$/.test(name)
    ? true
    : 'Use 1–64 lowercase letters, numbers, or hyphens; start with a letter (for example my-app).';
}

export function createStarter(name: string, template: string, parent = process.cwd()): string {
  const valid = validateProjectName(name);
  if (valid !== true) throw new Error(valid);
  const framework = normalizeTemplate(template);
  const files = getTemplateFiles(framework, name);
  files.push({ path: '.gitignore', content: getGitignoreContent(framework) });
  files.push({
    path: 'README.md',
    content: ['nextjs', 'react', 'vue'].includes(framework)
      ? getReadmeContent(framework, name, '', false, false)
      : `# ${name}\n\nCreated with Forjex (${framework}).\n\n## Start locally\n\n\`\`\`sh\n${getStarterCommands(framework).join('\n')}\n\`\`\`\n`,
  });
  const directory = resolve(parent, name);
  for (const file of files) {
    if (!resolve(directory, file.path).startsWith(directory + sep))
      throw new Error('Invalid template file path.');
  }
  mkdirSync(directory);
  for (const file of files) {
    const destination = resolve(directory, file.path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(
      destination,
      file.encoding === 'base64' ? Buffer.from(file.content, 'base64') : file.content,
      { flag: 'wx' },
    );
  }
  return directory;
}

export function getStarterCommands(template: string): string[] {
  switch (normalizeTemplate(template)) {
    case 'python':
      return [
        'python -m venv .venv',
        process.platform === 'win32' ? '.venv\\Scripts\\activate' : 'source .venv/bin/activate',
        'python -m pip install -r requirements.txt',
        'uvicorn main:app --reload',
      ];
    case 'go':
      return ['go run .'];
    case 'rust':
      return ['cargo run'];
    default:
      return ['npm install', 'npm run dev'];
  }
}

export async function installStarter(directory: string): Promise<void> {
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install'], {
      cwd: directory,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolvePromise()
        : reject(
            new Error(
              `npm install exited with code ${code}. Your starter files are saved in ${directory}.`,
            ),
          ),
    );
  });
}
