import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateAICommitMessage } from '../src/ai/commit-message';
import { AI_PROVIDERS, validAIModel, type AIProvider } from '../src/ai/settings';

const message = JSON.stringify({
  title: 'feat: add project search',
  body: 'Search saved projects by name.',
});
const hosts: Record<AIProvider, string> = {
  openai: 'api.openai.com',
  openrouter: 'openrouter.ai',
  gemini: 'generativelanguage.googleapis.com',
  grok: 'api.x.ai',
  anthropic: 'api.anthropic.com',
  mistral: 'api.mistral.ai',
};
function response(provider: AIProvider, incomplete = false) {
  if (provider === 'openai')
    return {
      status: incomplete ? 'incomplete' : 'completed',
      output: [{ type: 'message', content: [{ type: 'output_text', text: message }] }],
    };
  if (provider === 'gemini')
    return {
      candidates: [
        {
          finishReason: incomplete ? 'MAX_TOKENS' : 'STOP',
          content: { parts: [{ text: message }] },
        },
      ],
    };
  if (provider === 'anthropic')
    return {
      stop_reason: incomplete ? 'max_tokens' : 'end_turn',
      content: [{ type: 'text', text: '```json\n' + message + '\n```' }],
    };
  return {
    choices: [{ finish_reason: incomplete ? 'length' : 'stop', message: { content: message } }],
  };
}

for (const provider of Object.keys(AI_PROVIDERS) as AIProvider[]) {
  test(`${provider} uses its fixed endpoint and credential headers, parses its response, and rejects incomplete output`, async () => {
    const options = {
      provider,
      apiKey: 'selected-provider-key',
      model: provider === 'openrouter' ? 'author/model:free' : 'sample-model',
    };
    const result = await generateAICommitMessage(
      [{ path: 'src/search.ts', content: '+searchProjects();' }],
      {
        ...options,
        fetch: async (input, init) => {
          const url = new URL(String(input));
          assert.equal(url.hostname, hosts[provider]);
          assert.equal(url.search, '');
          assert.equal(init?.redirect, 'error');
          const headers = new Headers(init?.headers);
          assert.equal(
            provider === 'gemini' ? headers.get('x-goog-api-key') : headers.get('authorization'),
            provider === 'gemini' ? 'selected-provider-key' : 'Bearer selected-provider-key',
          );
          const payload = JSON.parse(String(init?.body));
          assert.match(String(init?.body), /searchProjects/);
          if (provider === 'gemini') assert.equal(payload.contents[0].role, 'user');
          if (provider === 'anthropic')
            assert.equal(headers.get('anthropic-version'), '2026-10-21');
          return Response.json(response(provider));
        },
      },
    );
    assert.equal(result.message, 'feat: add project search\n\nSearch saved projects by name.');
    await assert.rejects(
      generateAICommitMessage([{ path: 'src/search.ts', content: '+searchProjects();' }], {
        ...options,
        fetch: async () => Response.json(response(provider, true)),
      }),
      /incomplete/,
    );
  });
}

test('unsupported providers and unsafe model identifiers fail before any request', async () => {
  assert.ok(validAIModel('anthropic/claude:model'));
  for (const model of ['../escape', 'author/../escape', 'https://evil.test', 'author//model'])
    assert.equal(validAIModel(model), false);
  await assert.rejects(
    generateAICommitMessage([{ path: 'src/a.ts', content: 'change' }], {
      provider: 'unknown' as AIProvider,
      apiKey: 'private',
      model: 'sample',
      fetch: async () => {
        throw new Error('Must not send credentials');
      },
    }),
    /Unsupported/,
  );
});
