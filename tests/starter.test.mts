import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createStarter, STARTERS, normalizeTemplate } from '../src/services/starter.js';

test('each supported starter creates runnable entry files without provider credentials', () => {
  const parent = mkdtempSync(join(tmpdir(), 'forjex-starters-'));
  try {
    const entries: Record<string, string> = {
      nextjs: 'src/app/page.tsx',
      react: 'src/App.tsx',
      vue: 'src/App.vue',
      python: 'main.py',
      go: 'main.go',
      rust: 'src/main.rs',
    };
    for (const starter of STARTERS) {
      const directory = createStarter(`app-${starter.value}`, starter.value, parent);
      assert.ok(existsSync(join(directory, entries[starter.value])));
      assert.ok(existsSync(join(directory, '.gitignore')));
      assert.match(
        readFileSync(join(directory, 'README.md'), 'utf8'),
        /Start locally|Getting started/,
      );
      assert.equal(existsSync(join(directory, '.git')), false);
      assert.equal(existsSync(join(directory, 'vercel.json')), false);
    }
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test('invalid names, unknown frameworks, and existing folders cannot overwrite files', () => {
  const parent = mkdtempSync(join(tmpdir(), 'forjex-safe-'));
  try {
    for (const name of ['../escape', '.', '/tmp/escape', 'a/b', 'My App', 'name;echo']) {
      assert.throws(() => createStarter(name, 'nextjs', parent));
    }
    assert.throws(() => createStarter('unsupported', 'angular', parent), /Unknown template/);
    assert.equal(existsSync(join(parent, 'unsupported')), false);
    const directory = createStarter('my-app', 'react', parent);
    writeFileSync(join(directory, 'src/App.tsx'), 'user work');
    assert.throws(() => createStarter('my-app', 'nextjs', parent), /EEXIST/);
    assert.equal(readFileSync(join(directory, 'src/App.tsx'), 'utf8'), 'user work');
    assert.equal(existsSync(join(directory, 'app')), false);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test('framework aliases resolve to supported starters', () => {
  assert.equal(normalizeTemplate('vite-react'), 'react');
  assert.equal(normalizeTemplate('python-fastapi'), 'python');
  assert.equal(normalizeTemplate('go-api'), 'go');
  assert.equal(normalizeTemplate('rust-app'), 'rust');
});

test('frontend starters include real ICO assets, quality tools, and no branded logo component', () => {
  const parent = mkdtempSync(join(tmpdir(), 'forjex-foundation-'));
  try {
    for (const template of ['nextjs', 'react', 'vue']) {
      const directory = createStarter(`app-${template}`, template, parent);
      const icon = readFileSync(
        join(directory, template === 'nextjs' ? 'src/app/favicon.ico' : 'public/favicon.ico'),
      );
      assert.equal(icon.readUInt16LE(0), 0);
      assert.equal(icon.readUInt16LE(2), 1, 'favicon must be an ICO, not base64 or SVG text');
      assert.equal(icon.readUInt16LE(4), 4, 'ICO includes four sizes');
      assert.ok(existsSync(join(directory, 'src/services/api-client.ts')));
      assert.ok(existsSync(join(directory, 'tests/api-client.test.ts')));
      assert.ok(existsSync(join(directory, '.env.example')));
      assert.equal(existsSync(join(directory, 'src/components/forjex-logo.tsx')), false);
      assert.equal(existsSync(join(directory, 'src/components/ForjexLogo.vue')), false);
      const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
      assert.match(manifest.scripts.check, /typecheck.*lint.*test/);
    }
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test('the CLI accepts template options, creates locally, and reports invalid inputs with a failure status', () => {
  const parent = mkdtempSync(join(tmpdir(), 'forjex-cli-'));
  const entry = fileURLToPath(new URL('../src/index.ts', import.meta.url));
  const loader = fileURLToPath(new URL('../node_modules/tsx/dist/loader.mjs', import.meta.url));
  const run = (...args: string[]) =>
    spawnSync(process.execPath, ['--import', loader, entry, ...args], {
      cwd: parent,
      encoding: 'utf8',
    });
  try {
    const result = run('create', 'my-app', '--template', 'nextjs', '--no-install');
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /npm run dev/);
    assert.ok(existsSync(join(parent, 'my-app/src/features/home/components/home-screen.tsx')));
    assert.equal(existsSync(join(parent, 'my-app/node_modules')), false);
    const duplicate = run('create', 'my-app', '--template', 'react', '--no-install');
    assert.equal(duplicate.status, 1);
    const invalid = run('forge', 'bad-app', '--template', 'angular', '--no-install');
    assert.equal(invalid.status, 1);
    assert.match(invalid.stdout + invalid.stderr, /Unknown template/);
    assert.equal(existsSync(join(parent, 'bad-app')), false);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});
