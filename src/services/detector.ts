import { existsSync, readFileSync } from 'fs';
import { execSync } from 'node:child_process';
import { logger } from '../utils/logger.js';
import type { ProjectConfig } from '../types/index.js';

export class ProjectDetector {
  private workingDir: string;

  constructor(workingDir: string = process.cwd()) {
    this.workingDir = workingDir;
  }

  detect(): ProjectConfig {
    const spinner = logger.spinner('🔍 Detecting project type...');

    try {
      let config: ProjectConfig = { type: 'unknown' };

      if (existsSync('package.json')) {
        config = this.detectNodeProject();
        spinner.succeed(`✅ Detected: ${config.type.toUpperCase()} project`);
        return config;
      }

      if (
        existsSync('requirements.txt') ||
        existsSync('pyproject.toml') ||
        existsSync('setup.py')
      ) {
        config = this.detectPythonProject();
        spinner.succeed(`✅ Detected: ${config.type.toUpperCase()} project`);
        return config;
      }

      if (existsSync('go.mod')) {
        config = this.detectGoProject();
        spinner.succeed(`✅ Detected: ${config.type.toUpperCase()} project`);
        return config;
      }

      if (existsSync('Cargo.toml')) {
        config = this.detectRustProject();
        spinner.succeed(`✅ Detected: ${config.type.toUpperCase()} project`);
        return config;
      }

      spinner.warn('⚠️  Could not detect project type');
      return config;
    } catch {
      spinner.fail('Failed to detect project type');
      return { type: 'unknown' };
    }
  }

  private detectNodeProject(): ProjectConfig {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));

    let packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' = 'npm';
    if (existsSync('pnpm-lock.yaml')) packageManager = 'pnpm';
    else if (existsSync('yarn.lock')) packageManager = 'yarn';
    else if (existsSync('bun.lockb')) packageManager = 'bun';

    const hasTests = !!(
      packageJson.scripts?.test &&
      packageJson.scripts.test !== 'echo "Error: no test specified" && exit 1'
    );

    let buildCommand = 'npm run build';
    if (packageJson.scripts?.build) {
      buildCommand = `${packageManager} run build`;
    }

    const testCommand = hasTests ? `${packageManager} test` : undefined;

    return {
      type: 'nodejs',
      framework: packageJson.dependencies?.next
        ? 'nextjs'
        : packageJson.dependencies?.vue
          ? 'vue'
          : packageJson.dependencies?.react
            ? 'vite-react'
            : 'nodejs',
      packageManager,
      hasTests,
      buildCommand,
      testCommand,
    };
  }

  private detectPythonProject(): ProjectConfig {
    const hasTests = existsSync('tests') || existsSync('test');

    return {
      type: 'python',
      hasTests,
      buildCommand: 'python -m pip install -r requirements.txt',
      testCommand: hasTests ? 'pytest' : undefined,
    };
  }

  private detectGoProject(): ProjectConfig {
    const hasTests = existsSync('*_test.go') || this.hasGoTestFiles();

    return {
      type: 'go',
      hasTests,
      buildCommand: 'go build',
      testCommand: hasTests ? 'go test ./...' : undefined,
    };
  }

  private detectRustProject(): ProjectConfig {
    return {
      type: 'rust',
      hasTests: true,
      buildCommand: 'cargo build --release',
      testCommand: 'cargo test',
    };
  }

  private hasGoTestFiles(): boolean {
    try {
      const result = execSync('find . -name "*_test.go" -type f', { encoding: 'utf-8' });
      return result.trim().length > 0;
    } catch {
      return false;
    }
  }
}
