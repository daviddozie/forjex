import assert from 'node:assert/strict';
import { test } from 'node:test';

delete process.env.DATABASE_URL;
const { POST } = await import('../src/app/api/commit-message/route');

test('cloud generation rejects malformed bodies and invalid field types before provider requests', async () => {
  const original = globalThis.fetch;
  let unexpectedCalls = 0;
  globalThis.fetch = async (input) => {
    if (String(input) === 'https://api.github.com/user')
      return Response.json({ id: 1, login: 'alice' });
    unexpectedCalls++;
    throw new Error('Invalid input must not reach a provider.');
  };
  const valid = {
    repoMode: 'new',
    name: 'my-app',
    template: 'nextjs',
    apiKey: 'request-only-key',
    model: 'custom-model',
  };
  const invalidBodies = [
    '',
    '{',
    'null',
    '[]',
    'true',
    '42',
    '"text"',
    ...[
      {},
      { ...valid, repoMode: 'other' },
      { ...valid, template: [] },
      { ...valid, name: {} },
      { ...valid, provider: {} },
      { ...valid, model: [] },
      { ...valid, apiKey: 123 },
      { ...valid, existingRepoUrl: {} },
      { ...valid, repoMode: 'existing', existingRepoUrl: 'https://example.com/a/b' },
      ...['isPrivate', 'addReadme', 'addCICD', 'deployVercel'].map((field) => ({
        ...valid,
        [field]: 'false',
      })),
    ].map((body) => JSON.stringify(body)),
  ];
  try {
    for (const body of invalidBodies) {
      const response = await POST(
        new Request('https://forjex.test/api/commit-message', {
          method: 'POST',
          headers: { Authorization: 'Bearer github-test', 'Content-Type': 'application/json' },
          body,
        }),
      );
      assert.equal(response.status, 400, `Body: ${body}`);
      const result = await response.json();
      assert.equal(typeof result.error, 'string');
      assert.ok(!JSON.stringify(result).includes('request-only-key'));
    }
    assert.equal(unexpectedCalls, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test('authenticated cloud generation previews real additions without writing GitHub or persisting an API key', async () => {
  const original = globalThis.fetch;
  const calls: { url: string; method: string; body: any }[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method || 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    calls.push({ url, method, body });
    if (url === 'https://api.github.com/user')
      return Response.json({ id: 1, login: 'alice', name: 'Alice' });
    if (url === 'https://api.openai.com/v1/responses') {
      assert.equal(
        (init?.headers as Record<string, string>).Authorization,
        'Bearer request-only-key',
      );
      assert.equal(body.store, false);
      assert.equal(body.model, 'custom-model');
      return Response.json({
        status: 'completed',
        output: [
          {
            type: 'message',
            content: [
              {
                type: 'output_text',
                text: JSON.stringify({
                  title: 'feat: bootstrap a Forjex starter',
                  body: 'Add the branded welcome page and starter documentation.',
                }),
              },
            ],
          },
        ],
      });
    }
    throw new Error(`Unexpected provider request: ${method} ${url}`);
  };
  try {
    const response = await POST(
      new Request('https://forjex.test/api/commit-message', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-github', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoMode: 'new',
          name: 'my-app',
          template: 'nextjs',
          addReadme: true,
          addCICD: false,
          deployVercel: false,
          apiKey: 'request-only-key',
          model: 'custom-model',
        }),
      }),
    );
    const result = await response.json();
    assert.equal(response.status, 200, JSON.stringify(result));
    assert.match(result.message, /^feat: bootstrap/);
    assert.match(result.commitPlanHash, /^[a-f0-9]{64}$/);
    assert.ok(result.included.includes('src/features/home/components/home-screen.tsx'));
    assert.ok(result.omitted.includes('src/app/favicon.ico'));
    assert.ok(!JSON.stringify(result).includes('request-only-key'));
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(
      calls
        .filter((call) => call.url.startsWith('https://api.github.com'))
        .map((call) => call.method),
      ['GET'],
    );
  } finally {
    globalThis.fetch = original;
  }
});

test('cloud routes selected providers and rejects unknown providers before sending the AI key', async () => {
  const original = globalThis.fetch;
  const targets: Record<string, string> = {
    openrouter: 'openrouter.ai',
    gemini: 'generativelanguage.googleapis.com',
    grok: 'api.x.ai',
    anthropic: 'api.anthropic.com',
    mistral: 'api.mistral.ai',
  };
  const message = JSON.stringify({ title: 'feat: bootstrap project', body: 'Add the starter.' });
  let selected = '';
  let aiCalls = 0;
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.hostname === 'api.github.com' && url.pathname === '/user')
      return Response.json({ id: 1, login: 'alice' });
    aiCalls++;
    assert.equal(url.hostname, targets[selected]);
    const headers = new Headers(init?.headers);
    assert.equal(
      selected === 'gemini' ? headers.get('x-goog-api-key') : headers.get('authorization'),
      selected === 'gemini' ? 'selected-key' : 'Bearer selected-key',
    );
    if (selected === 'gemini')
      return Response.json({
        candidates: [{ finishReason: 'STOP', content: { parts: [{ text: message }] } }],
      });
    if (selected === 'anthropic')
      return Response.json({ stop_reason: 'end_turn', content: [{ type: 'text', text: message }] });
    return Response.json({ choices: [{ finish_reason: 'stop', message: { content: message } }] });
  };
  try {
    for (const provider of [...Object.keys(targets), 'unknown']) {
      selected = provider;
      const before = aiCalls;
      const response = await POST(
        new Request('https://forjex.test/api/commit-message', {
          method: 'POST',
          headers: { Authorization: 'Bearer github-test', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repoMode: 'new',
            name: 'my-app',
            template: 'nextjs',
            provider,
            model: provider === 'openrouter' ? 'author/model' : 'sample-model',
            apiKey: 'selected-key',
            addCICD: false,
            deployVercel: false,
          }),
        }),
      );
      const result = await response.json();
      assert.equal(response.status, provider === 'unknown' ? 400 : 200, JSON.stringify(result));
      assert.equal(aiCalls, before + (provider === 'unknown' ? 0 : 1));
      assert.ok(!JSON.stringify(result).includes('selected-key'));
    }
  } finally {
    globalThis.fetch = original;
  }
});
