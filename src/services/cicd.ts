import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { logger } from '../utils/logger.js';
import type { ProjectConfig } from '../types/index.js';

export class CICDGenerator {
  private config: ProjectConfig;

  constructor(config: ProjectConfig) {
    this.config = config;
  }

  generate(): void {
    const spinner = logger.spinner('⚙️  Generating CI/CD pipeline...');

    try {
      // Create .github/workflows directory
      if (!existsSync('.github')) {
        mkdirSync('.github');
      }
      if (!existsSync('.github/workflows')) {
        mkdirSync('.github/workflows');
      }

      // Generate appropriate workflow based on project type
      let workflowContent = '';

      switch (this.config.type) {
        case 'nodejs':
          workflowContent = this.generateNodeWorkflow();
          break;
        case 'python':
          workflowContent = this.generatePythonWorkflow();
          break;
        case 'go':
          workflowContent = this.generateGoWorkflow();
          break;
        case 'rust':
          workflowContent = this.generateRustWorkflow();
          break;
        default:
          throw new Error('Unknown project type');
      }

      // Write workflow file
      writeFileSync('.github/workflows/ci.yml', workflowContent);
      spinner.succeed('CI/CD pipeline created: .github/workflows/ci.yml');
    } catch (error: any) {
      spinner.fail('Failed to generate CI/CD pipeline');
      throw error;
    }
  }

  private getNodeVersions(): string {
    try {
      if (existsSync('package.json')) {
        const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        // Check for Next.js - requires Node 20+
        if (deps['next']) {
          const nextVersion = deps['next'];
          // Next.js 14+ requires Node 20+
          if (nextVersion.includes('14') || nextVersion.includes('15')) {
            return '[20.x, 22.x]';
          }
        }

        if (packageJson.engines?.node) {
          const nodeEngine = packageJson.engines.node;
          const match = nodeEngine.match(/>=?(\d+)/);
          if (match) {
            const minVersion = parseInt(match[1]);
            if (minVersion >= 20) return '[20.x, 22.x]';
            if (minVersion >= 18) return '[18.x, 20.x, 22.x]';
          }
        }
      }
    } catch (error) {
      // Default fallback
    }

    return '[20.x, 22.x]';
  }

  private generateNodeWorkflow(): string {
    const { packageManager, hasTests, buildCommand, testCommand } = this.config;

    // Only enable cache if lock file exists
    const cacheConfig = this.hasLockFile(packageManager!)
      ? `cache: '${packageManager}'`
      : '';

    const hasBuildScript = this.hasBuildScript();

    const nodeVersions = this.getNodeVersions();

    return `name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: ${nodeVersions}

    steps:
    - name: 📦 Checkout code
      uses: actions/checkout@v4

    - name: 🔧 Setup Node.js $\{{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: $\{{ matrix.node-version }}${cacheConfig ? `
        ${cacheConfig}` : ''}

    - name: 📥 Install dependencies
      run: ${this.getInstallCommand(packageManager!)}

    - name: 🔍 Lint code
      run: ${packageManager} run lint || echo "No lint script found"
      continue-on-error: true
${hasTests ? `
    - name: 🧪 Run tests
      run: ${testCommand}
` : ''}${hasBuildScript ? `
    - name: 🏗️  Build project
      run: ${buildCommand}` : ''}
`;
  }

  private generatePythonWorkflow(): string {
    const { hasTests, testCommand } = this.config;

    return `name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        python-version: ['3.9', '3.10', '3.11']

    steps:
    - name: 📦 Checkout code
      uses: actions/checkout@v4

    - name: 🐍 Setup Python $\{{ matrix.python-version }}
      uses: actions/setup-python@v5
      with:
        python-version: $\{{ matrix.python-version }}

    - name: 📥 Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt

    - name: 🔍 Lint with flake8
      run: |
        pip install flake8
        flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
      continue-on-error: true
${hasTests ? `
    - name: 🧪 Run tests
      run: ${testCommand}
` : ''}`;
  }

  private generateGoWorkflow(): string {
    const { hasTests } = this.config;

    return `name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        go-version: ['1.20', '1.21']

    steps:
    - name: 📦 Checkout code
      uses: actions/checkout@v4

    - name: 🔧 Setup Go $\{{ matrix.go-version }}
      uses: actions/setup-go@v5
      with:
        go-version: $\{{ matrix.go-version }}

    - name: 📥 Install dependencies
      run: go mod download

    - name: 🔍 Lint code
      run: |
        go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
        golangci-lint run
      continue-on-error: true
${hasTests ? `
    - name: 🧪 Run tests
      run: go test ./... -v
` : ''}
    - name: 🏗️  Build project
      run: go build -v ./...
`;
  }

  private generateRustWorkflow(): string {
    return `name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
    - name: 📦 Checkout code
      uses: actions/checkout@v4

    - name: 🦀 Setup Rust
      uses: actions-rs/toolchain@v1
      with:
        profile: minimal
        toolchain: stable
        override: true
        components: rustfmt, clippy

    - name: 🔍 Check formatting
      run: cargo fmt -- --check
      continue-on-error: true

    - name: 🔍 Lint with Clippy
      run: cargo clippy -- -D warnings
      continue-on-error: true

    - name: 🧪 Run tests
      run: cargo test --verbose

    - name: 🏗️  Build project
      run: cargo build --release --verbose
`;
  }

  private hasLockFile(packageManager: string): boolean {
    const lockFiles: Record<string, string> = {
      npm: 'package-lock.json',
      yarn: 'yarn.lock',
      pnpm: 'pnpm-lock.yaml',
      bun: 'bun.lockb'
    };

    const lockFile = lockFiles[packageManager];
    return lockFile ? existsSync(lockFile) : false;
  }

  private hasBuildScript(): boolean {
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      return !!packageJson.scripts?.build;
    } catch {
      return false;
    }
  }

  private getInstallCommand(packageManager: string): string {
    const commands: Record<string, string> = {
      npm: 'npm install',
      yarn: 'yarn install --frozen-lockfile',
      pnpm: 'pnpm install --frozen-lockfile',
      bun: 'bun install --frozen-lockfile'
    };
    return commands[packageManager] || 'npm ci';
  }
}