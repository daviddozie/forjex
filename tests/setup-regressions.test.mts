import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CICDGenerator } from '../src/services/cicd';
import { VercelService } from '../src/services/vercel';

const lockfiles: Record<string, string> = {
  npm: 'package-lock.json',
  pnpm: 'pnpm-lock.yaml',
  yarn: 'yarn.lock',
  bun: 'bun.lockb',
};
test('generated Node CI installs without a lockfile and retains locked installs when one exists', () => {
  const original = process.cwd();
  const directory = mkdtempSync(join(tmpdir(), 'forjex-ci-locks-'));
  try {
    process.chdir(directory);
    writeFileSync('package.json', '{"scripts":{"build":"build"}}');
    for (const [manager, lockfile] of Object.entries(lockfiles)) {
      new CICDGenerator({ type: 'nodejs', packageManager: manager }).generate();
      const unlocked = readFileSync('.github/workflows/ci.yml', 'utf8');
      assert.match(unlocked, new RegExp(`run: ${manager} install\\n`));
      assert.doesNotMatch(unlocked, /--frozen-lockfile/);
      assert.doesNotMatch(unlocked, /cache:/);
      writeFileSync(lockfile, 'lock');
      new CICDGenerator({ type: 'nodejs', packageManager: manager }).generate();
      const locked = readFileSync('.github/workflows/ci.yml', 'utf8');
      assert.match(locked, new RegExp(`cache: '${manager}'`));
      if (manager !== 'npm') assert.match(locked, /--frozen-lockfile/);
      rmSync(lockfile);
    }
  } finally {
    process.chdir(original);
    rmSync(directory, { recursive: true, force: true });
  }
});

test('CLI Vercel configuration serves starter docs for React and Vue while preserving other frameworks and existing config', () => {
  const original = process.cwd();
  const directory = mkdtempSync(join(tmpdir(), 'forjex-docs-rewrite-'));
  try {
    process.chdir(directory);
    writeFileSync('package.json', '{}');
    for (const framework of ['vite-react', 'vue', 'nextjs', 'unknown']) {
      new VercelService().createVercelConfigOnly('sample-app', {
        type: 'nodejs',
        framework,
        buildCommand: 'npm run build',
      });
      const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
      assert.equal(config.buildCommand, 'npm run build');
      if (['vite-react', 'vue'].includes(framework))
        assert.deepEqual(config.rewrites, [{ source: '/docs', destination: '/index.html' }]);
      else assert.equal(config.rewrites, undefined);
      rmSync('vercel.json');
    }
    writeFileSync('vercel.json', '{"custom":"preserve"}');
    new VercelService().createVercelConfigOnly('sample-app', { type: 'nodejs', framework: 'vue' });
    assert.equal(readFileSync('vercel.json', 'utf8'), '{"custom":"preserve"}');
  } finally {
    process.chdir(original);
    rmSync(directory, { recursive: true, force: true });
  }
});
