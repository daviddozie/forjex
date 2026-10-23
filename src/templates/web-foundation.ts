import type { TemplateFile } from './content.js';

export function getFoundationFiles(framework: string, name: string): TemplateFile[] {
  const next = framework === 'nextjs';
  const vue = framework === 'vue';
  const title = JSON.stringify(name).replace(/</g, '\\u003c');
  const files: TemplateFile[] = [
    {
      path: '.editorconfig',
      content:
        'root = true\n\n[*]\ncharset = utf-8\nindent_style = space\nindent_size = 2\nend_of_line = lf\ninsert_final_newline = true\ntrim_trailing_whitespace = true\n',
    },
    {
      path: '.prettierrc.json',
      content:
        JSON.stringify({ singleQuote: true, trailingComma: 'all', printWidth: 100 }, null, 2) +
        '\n',
    },
    {
      path: '.prettierignore',
      content: 'node_modules\n.next\ndist\ncoverage\npackage-lock.json\n',
    },
    {
      path: '.env.example',
      content: `# Optional API origin. Leave empty for same-origin requests.\n${next ? 'NEXT_PUBLIC' : 'VITE'}_API_URL=\n`,
    },
    {
      path: 'src/config/site.ts',
      content: `export const siteConfig = {\n  name: ${title},\n  description: 'A focused foundation for your next application.',\n} as const;\n`,
    },
    {
      path: 'src/config/env.ts',
      content: `export const env = {\n  apiUrl: ${next ? 'process.env.NEXT_PUBLIC_API_URL' : 'import.meta.env.VITE_API_URL'} || '',\n} as const;\n`,
    },
    {
      path: 'src/constants/routes.ts',
      content: `export const routes = {\n  home: '/',\n  gettingStarted: '/#getting-started',\n  workspace: '/#workspace',\n} as const;\n`,
    },
    {
      path: 'src/types/navigation.ts',
      content: `export interface NavigationItem {\n  label: string;\n  href: string;\n}\n`,
    },
    {
      path: 'src/types/api.ts',
      content: `export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {\n  json?: unknown;\n}\n`,
    },
    {
      path: 'src/lib/api-error.ts',
      content: `export class ApiError extends Error {\n  constructor(public readonly status: number, message: string) {\n    super(message);\n    this.name = 'ApiError';\n  }\n}\n`,
    },
    {
      path: 'src/services/api-client.ts',
      content: `import { env } from '@/config/env';\nimport { ApiError } from '@/lib/api-error';\nimport type { ApiRequestOptions } from '@/types/api';\n\nexport async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {\n  const { json, ...init } = options;\n  const headers = new Headers(init.headers);\n  headers.set('Accept', 'application/json');\n  if (json !== undefined) headers.set('Content-Type', 'application/json');\n\n  const response = await fetch(env.apiUrl + path, {\n    ...init,\n    headers,\n    ...(json !== undefined ? { body: JSON.stringify(json) } : {}),\n  });\n  if (!response.ok) throw new ApiError(response.status, 'Request failed (' + response.status + ')');\n  if (response.status === 204) return undefined as T;\n  return response.json() as Promise<T>;\n}\n`,
    },
    {
      path: 'src/utils/format.ts',
      content: `const numberFormatter = new Intl.NumberFormat('en-US');\n\nexport function formatCount(value: number): string {\n  return numberFormatter.format(value);\n}\n`,
    },
    {
      path: 'src/features/home/types.ts',
      content: `export interface SetupStep {\n  title: string;\n  description: string;\n  command: string;\n}\n`,
    },
    {
      path: 'src/features/home/data/setup-steps.ts',
      content: `import type { SetupStep } from '../types';\n\nexport const setupSteps: SetupStep[] = [\n  { title: 'Develop', description: 'Start the development server and make your first change.', command: 'npm run dev' },\n  { title: 'Verify', description: 'Check types, lint rules, and unit tests together.', command: 'npm run check' },\n  { title: 'Build', description: 'Generate an optimized production build.', command: 'npm run build' },\n];\n`,
    },
    {
      path: 'vitest.config.ts',
      content: `import { fileURLToPath, URL } from 'node:url';\nimport { defineConfig } from 'vitest/config';\n\nexport default defineConfig({\n  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },\n  test: { environment: 'node', include: ['tests/**/*.test.ts'], restoreMocks: true },\n});\n`,
    },
    {
      path: 'tests/format.test.ts',
      content: `import { describe, expect, it } from 'vitest';\nimport { formatCount } from '../src/utils/format';\n\ndescribe('formatCount', () => {\n  it('formats counts with grouping', () => {\n    expect(formatCount(1250)).toBe('1,250');\n  });\n  it('handles zero and negative values', () => {\n    expect(formatCount(0)).toBe('0');\n    expect(formatCount(-20)).toBe('-20');\n  });\n});\n`,
    },
    {
      path: 'tests/api-client.test.ts',
      content: `import { afterEach, describe, expect, it, vi } from 'vitest';\nimport { apiRequest } from '../src/services/api-client';\nimport { ApiError } from '../src/lib/api-error';\n\nafterEach(() => vi.unstubAllGlobals());\n\ndescribe('apiRequest', () => {\n  it('serializes JSON and forwards cancellation', async () => {\n    const request = vi.fn().mockResolvedValue(Response.json({ id: 1 }));\n    vi.stubGlobal('fetch', request);\n    const controller = new AbortController();\n    const result = await apiRequest<{ id: number }>('/items', { method: 'POST', json: { name: 'Example' }, signal: controller.signal });\n    expect(result.id).toBe(1);\n    expect(request.mock.calls[0][1].body).toBe(JSON.stringify({ name: 'Example' }));\n    expect(request.mock.calls[0][1].signal).toBe(controller.signal);\n  });\n  it('rejects failed responses with their status', async () => {\n    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));\n    await expect(apiRequest('/items')).rejects.toBeInstanceOf(ApiError);\n    await expect(apiRequest('/items')).rejects.toMatchObject({ status: 503 });\n  });\n  it('handles a successful response with no content', async () => {\n    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));\n    await expect(apiRequest('/items')).resolves.toBeUndefined();\n  });\n});\n`,
    },
    {
      path: 'eslint.config.mjs',
      content: `import js from '@eslint/js';\nimport tseslint from 'typescript-eslint';\nimport globals from 'globals';\n${vue ? "import vue from 'eslint-plugin-vue';" : "import reactHooks from 'eslint-plugin-react-hooks';"}\n${next ? "import next from '@next/eslint-plugin-next';\n" : ''}\nexport default tseslint.config(\n  { ignores: ['node_modules/**', '.next/**', 'dist/**', 'coverage/**', 'next-env.d.ts'] },\n  js.configs.recommended,\n  ...tseslint.configs.recommended,\n  ${vue ? "...vue.configs['flat/essential'],\n  { files: ['**/*.vue'], languageOptions: { parserOptions: { parser: tseslint.parser } } }," : `{ plugins: { 'react-hooks': reactHooks${next ? ", '@next/next': next" : ''} }, rules: { ...reactHooks.configs.recommended.rules${next ? ", ...next.configs.recommended.rules, ...next.configs['core-web-vitals'].rules" : ''} } },`}\n  { languageOptions: { globals: { ...globals.browser, ...globals.node } }, rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } },\n);\n`,
    },
  ];
  return files;
}

export const starterStyles = `:root {
  color-scheme: dark;
  font-family: Inter, system-ui, -apple-system, sans-serif;
  color: #f5f5f5;
  background: #0a0a0a;
  font-synthesis: none;
  --muted: #a3a3a3;
  --border: #262626;
  --surface: #111111;
}
* { box-sizing: border-box; }
body { margin: 0; }
a { color: inherit; text-decoration: none; }
button, input { font: inherit; }
button, a { -webkit-tap-highlight-color: transparent; }
button:focus-visible, a:focus-visible { outline: 2px solid #93c5fd; outline-offset: 5px; }
.site-header, .site-footer, main { width: min(100% - 48px, 1040px); margin-inline: auto; }
.site-header { display: flex; justify-content: space-between; align-items: center; gap: 24px; min-height: 88px; border-bottom: 1px solid var(--border); }
.brand { font-weight: 650; letter-spacing: -.04em; overflow-wrap: anywhere; }
nav { display: flex; gap: 24px; font-size: .8rem; color: var(--muted); }
main { padding-block: 80px; }
h1 { max-width: 800px; font-size: clamp(2.75rem, 7vw, 5rem); line-height: 1.05; letter-spacing: -.055em; margin: 20px 0; overflow-wrap: anywhere; }
p { color: var(--muted); line-height: 1.8; }
.eyebrow { font-size: .7rem; text-transform: uppercase; letter-spacing: .16em; }
.hero-description { max-width: 580px; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 16px; margin-block: 48px; }
.card { padding: 28px; border: 1px solid var(--border); border-radius: 16px; background: var(--surface); }
h2 { font-size: 1rem; margin-top: 0; font-weight: 600; }
code { font-family: ui-monospace, SFMono-Regular, monospace; color: #dbeafe; font-size: .8rem; overflow-wrap: anywhere; }
.card p { font-size: .85rem; }
.workspace { display: flex; justify-content: space-between; align-items: center; gap: 24px; flex-wrap: wrap; border-top: 1px solid var(--border); padding-top: 40px; }
.workspace p { font-size: .85rem; margin-bottom: 0; }
.counter { display: flex; align-items: center; gap: 12px; }
.counter output { min-width: 32px; text-align: center; font-variant-numeric: tabular-nums; }
.button { cursor: pointer; border: 1px solid #e5e5e5; border-radius: 8px; background: #f5f5f5; color: #171717; padding: 10px 16px; font-size: .8rem; font-weight: 550; }
.button:hover { background: #d4d4d4; }
.button:disabled { cursor: not-allowed; opacity: .5; }
.button.secondary { background: transparent; color: #a3a3a3; border-color: var(--border); }
.site-footer { padding-block: 28px; border-top: 1px solid var(--border); color: var(--muted); font-size: .75rem; }
.state { min-height: 60vh; display: grid; align-content: center; justify-items: start; gap: 16px; }
.skeleton { width: 60%; height: 32px; border-radius: 8px; background: var(--border); }
@media (max-width: 600px) { .site-header { align-items: flex-start; padding-block: 24px; flex-direction: column; } main { padding-block: 48px; } }
`;
