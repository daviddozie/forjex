import assert from 'node:assert/strict';
import { test } from 'node:test';

delete process.env.DATABASE_URL;
const { POST } = await import('../src/app/api/commit-message/route');

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
