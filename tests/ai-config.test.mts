import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, readFileSync, statSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadAIConfig, saveAIConfig, resolveAIConfig, clearAIConfig } from '../src/utils/ai-config';

test('AI settings persist separately with private key-file permissions and environment overrides', () => {
  const directory = mkdtempSync(join(tmpdir(), 'forjex-ai-settings-'));
  try {
    writeFileSync(join(directory, 'config.json'), '{"githubToken":"existing-github-token"}');
    saveAIConfig(
      { provider: 'openai', model: 'custom-model', apiKey: 'private-test-key' },
      directory,
    );
    assert.equal(statSync(join(directory, 'ai.json')).mode & 0o777, 0o600);
    const config = loadAIConfig(directory);
    assert.equal(resolveAIConfig({}, config).apiKey, 'private-test-key');
    assert.equal(resolveAIConfig({}, config).model, 'custom-model');
    const override = resolveAIConfig(
      { OPENAI_API_KEY: 'environment-key', FORJEX_AI_MODEL: 'environment-model' },
      config,
    );
    assert.equal(override.apiKey, 'environment-key');
    assert.equal(override.model, 'environment-model');
    assert.equal(override.keySource, 'environment');
    saveAIConfig({ provider: 'openai', model: 'no-saved-key' }, directory);
    assert.ok(!readFileSync(join(directory, 'ai.json'), 'utf8').includes('private-test-key'));
    clearAIConfig(directory);
    assert.equal(existsSync(join(directory, 'ai.json')), false);
    assert.equal(
      readFileSync(join(directory, 'config.json'), 'utf8'),
      '{"githubToken":"existing-github-token"}',
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('invalid saved settings are ignored and invalid model overrides are rejected', () => {
  const directory = mkdtempSync(join(tmpdir(), 'forjex-ai-invalid-'));
  try {
    writeFileSync(join(directory, 'ai.json'), '{"provider":"unsupported","model":"anything"}');
    assert.equal(loadAIConfig(directory), null);
    assert.equal(resolveAIConfig({}, null).model, 'gpt-4.1-mini');
    assert.throws(() => resolveAIConfig({ FORJEX_AI_MODEL: 'bad model\n' }, null));
    assert.throws(() => saveAIConfig({ provider: 'openai', model: '../bad-model' }, directory));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
