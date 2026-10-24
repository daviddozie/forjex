import type { TemplateFile } from './content.js';
import { faviconIco } from './favicon';
import { getFoundationFiles, starterStyles } from './web-foundation';

const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><style>svg{color:#171717}@media(prefers-color-scheme:dark){svg{color:#fafafa}}</style><path d="M12 2.5L2.5 7.5V17.5L12 22.5L21.5 17.5V7.5L12 2.5Z"/><path d="M12 2.5V12.5L21.5 7.5M2.5 7.5L12 12.5M17 10V15M12 12.5V22.5"/></svg>`;

export function getWebTemplateFiles(framework: string, name: string): TemplateFile[] {
  const next = framework === 'nextjs';
  const vue = framework === 'vue';
  const label = next
    ? 'Next.js + React + TypeScript'
    : vue
      ? 'Vue + Vite + TypeScript'
      : 'React + Vite + TypeScript';
  const entry = next ? 'src/app/page.tsx' : vue ? 'src/App.vue' : 'src/App.tsx';
  const files: TemplateFile[] = [
    ...getFoundationFiles(framework, name),
    {
      path: next ? 'src/app/favicon.ico' : 'public/favicon.ico',
      content: faviconIco,
      encoding: 'base64',
    },
    { path: 'public/favicon.svg', content: faviconSvg },
    {
      path: 'public/forjex.svg',
      content: faviconSvg
        .replace('color:#171717', 'color:#ecece8')
        .replace('color:#fafafa', 'color:#ecece8'),
    },
    { path: 'src/styles/globals.css', content: starterStyles },
    {
      path: 'package.json',
      content: json({
        name,
        version: '0.1.0',
        private: true,
        type: 'module',
        engines: { node: '^20.19.0 || ^22.13.0 || >=24' },
        scripts: {
          ...(next
            ? { dev: 'next dev', build: 'next build', start: 'next start' }
            : {
                dev: 'vite',
                build: vue ? 'vue-tsc --noEmit && vite build' : 'tsc --noEmit && vite build',
                preview: 'vite preview',
              }),
          lint: 'eslint . --max-warnings 0',
          typecheck: vue ? 'vue-tsc --noEmit' : 'tsc --noEmit',
          test: 'vitest run',
          'test:watch': 'vitest',
          format: 'prettier --write .',
          check: 'npm run typecheck && npm run lint && npm test',
        },
        dependencies: next
          ? { next: '15.5.28', react: '19.0.0', 'react-dom': '19.0.0' }
          : vue
            ? { vue: '^3.5.13' }
            : { react: '^18.3.1', 'react-dom': '^18.3.1' },
        devDependencies: {
          '@types/node': '^22.13.4',
          typescript: '~5.7.3',
          eslint: '^10.13.0',
          '@eslint/js': '^10.0.0',
          'typescript-eslint': '^8.72.0',
          globals: '^15.14.0',
          prettier: '^3.5.0',
          vitest: '^3.2.4',
          ...(next
            ? {
                '@next/eslint-plugin-next': '15.5.28',
                'eslint-plugin-react-hooks': '^7.1.1',
                '@types/react': '^19.0.8',
                '@types/react-dom': '^19.0.3',
              }
            : vue
              ? {
                  vite: '^6.0.1',
                  '@vitejs/plugin-vue': '^5.2.1',
                  'vue-tsc': '^2.2.0',
                  'eslint-plugin-vue': '^10.11.1',
                  'vue-eslint-parser': '^10.3.0',
                }
              : {
                  vite: '^6.0.1',
                  '@vitejs/plugin-react': '^4.3.4',
                  'eslint-plugin-react-hooks': '^7.1.1',
                  '@types/react': '^18.3.12',
                  '@types/react-dom': '^18.3.1',
                }),
        },
      }),
    },
    {
      path: 'tsconfig.json',
      content: json({
        compilerOptions: {
          target: 'ES2020',
          lib: ['DOM', 'DOM.Iterable', 'ESNext'],
          module: 'ESNext',
          moduleResolution: 'bundler',
          strict: true,
          skipLibCheck: true,
          noEmit: true,
          esModuleInterop: true,
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: next ? 'preserve' : 'react-jsx',
          paths: { '@/*': ['./src/*'] },
          ...(next
            ? { allowJs: true, plugins: [{ name: 'next' }], incremental: true }
            : { noUnusedLocals: true, noUnusedParameters: true }),
        },
        include: next
          ? ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts']
          : ['src', 'tests', 'vite.config.ts', 'vitest.config.ts'],
        exclude: ['node_modules', 'dist', 'coverage'],
      }),
    },
  ];
  if (vue) {
    files.push(
      { path: 'src/vite-env.d.ts', content: '/// <reference types="vite/client" />\n' },
      {
        path: 'src/composables/use-counter.ts',
        content: `import { ref } from 'vue';\n\nexport function useCounter(initial = 0) {\n  const count = ref(initial);\n  const increment = () => { count.value += 1; };\n  const reset = () => { count.value = initial; };\n  return { count, increment, reset };\n}\n`,
      },
      {
        path: 'src/components/ui/BaseButton.vue',
        content: `<script setup lang="ts">\nwithDefaults(defineProps<{ type?: 'button' | 'submit' | 'reset' }>(), { type: 'button' });\n</script>\n\n<template>\n  <button :type="type" class="button"><slot /></button>\n</template>\n`,
      },
      {
        path: 'src/components/layout/SiteHeader.vue',
        content: `<script setup lang="ts">\nimport { routes } from '@/constants/routes';\nimport type { NavigationItem } from '@/types/navigation';\nconst navigation: NavigationItem[] = [{ label: 'Get started', href: routes.gettingStarted }, { label: 'Documentation', href: routes.docs }];\n</script>\n\n<template>\n  <header class="site-header">\n    <a class="brand" :href="routes.home">Forjex</a>\n    <nav aria-label="Main navigation"><a v-for="item in navigation" :key="item.href" :href="item.href">{{ item.label }}</a></nav>\n  </header>\n</template>\n`,
      },
      {
        path: 'src/components/layout/SiteFooter.vue',
        content:
          '<template>\n  <footer class="site-footer">Forjex · A little structure. Plenty of possibility.</footer>\n</template>\n',
      },
      {
        path: 'src/features/home/components/AppCounter.vue',
        content: `<script setup lang="ts">\nimport BaseButton from '@/components/ui/BaseButton.vue';\nimport { useCounter } from '@/composables/use-counter';\nimport { formatCount } from '@/utils/format';\nconst { count, increment, reset } = useCounter();\n</script>\n\n<template>\n  <div class="counter">\n    <BaseButton class="secondary" @click="reset">Reset</BaseButton>\n    <output aria-live="polite" aria-label="Counter value">{{ formatCount(count) }}</output>\n    <BaseButton @click="increment">Increment</BaseButton>\n  </div>\n</template>\n`,
      },
      {
        path: 'src/features/home/components/HomeScreen.vue',
        content: `<script setup lang="ts">\nimport { setupSteps } from '../data/setup-steps';\nimport AppCounter from './AppCounter.vue';\n</script>\n\n<template>\n  <main>\n    <section class="hero"><div><p class="eyebrow">THE FORJEX STARTER · ${label}</p><h1>Your next idea<br />starts with <span>Forjex.</span></h1><p class="hero-description">A thoughtful foundation for building, shipping, and making something your own. Start locally. Connect GitHub, add CI/CD, and deploy when you’re ready.</p><a class="button" href="/docs">Explore your starter ↗</a></div><div class="logo-stage" aria-hidden="true"><div class="logo-orbit"><img class="hero-logo" src="/forjex.svg" alt="" /></div><span class="logo-caption">A LITTLE STRUCTURE. ENDLESS POSSIBILITY.</span></div></section>\n    <section id="getting-started" class="cards" aria-label="Getting started">\n      <article v-for="step in setupSteps" :key="step.title" class="card"><h2>{{ step.title }}</h2><p>{{ step.description }}</p><code>{{ step.command }}</code></article>\n    </section>\n    <section id="workspace" class="workspace"><div><h2>A place for every concern.</h2><p>Edit <code>${entry}</code> to start building. Try the counter to see a composable in action.</p></div><AppCounter /></section>\n  </main>\n</template>\n`,
      },
      {
        path: 'src/App.vue',
        content: `<script setup lang="ts">\nimport SiteHeader from '@/components/layout/SiteHeader.vue';\nimport SiteFooter from '@/components/layout/SiteFooter.vue';\nimport HomeScreen from '@/features/home/components/HomeScreen.vue';\nimport StarterDocs from '@/features/docs/StarterDocs.vue';\nconst isDocs = window.location.pathname === '/docs' || window.location.pathname === '/docs/';\n</script>\n\n<template>\n  <SiteHeader />\n  <StarterDocs v-if="isDocs" />\n  <HomeScreen v-else />\n  <SiteFooter />\n</template>\n`,
      },
      {
        path: 'src/main.ts',
        content: `import { createApp } from 'vue';\nimport App from './App.vue';\nimport './styles/globals.css';\ncreateApp(App).mount('#app');\n`,
      },
    );
  } else {
    files.push(
      {
        path: 'src/hooks/use-counter.ts',
        content: `'use client';\n\nimport { useCallback, useState } from 'react';\n\nexport function useCounter(initial = 0) {\n  const [count, setCount] = useState(initial);\n  const increment = useCallback(() => setCount(value => value + 1), []);\n  const reset = useCallback(() => setCount(initial), [initial]);\n  return { count, increment, reset };\n}\n`,
      },
      {
        path: 'src/components/ui/button.tsx',
        content: `import type { ButtonHTMLAttributes } from 'react';\n\nexport function Button({ className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {\n  return <button type={type} className={['button', className].filter(Boolean).join(' ')} {...props} />;\n}\n`,
      },
      {
        path: 'src/components/layout/site-header.tsx',
        content: `import { routes } from '@/constants/routes';\nimport type { NavigationItem } from '@/types/navigation';\n${next ? "import Link from 'next/link';\n" : ''}\nconst navigation: NavigationItem[] = [\n  { label: 'Get started', href: routes.gettingStarted },\n  { label: 'Documentation', href: routes.docs },\n];\n\nexport function SiteHeader() {\n  return (\n    <header className="site-header">\n      <${next ? 'Link' : 'a'} className="brand" href={routes.home}>Forjex</${next ? 'Link' : 'a'}>\n      <nav aria-label="Main navigation">{navigation.map(item => <${next ? 'Link' : 'a'} key={item.href} href={item.href}>{item.label}</${next ? 'Link' : 'a'}>)}</nav>\n    </header>\n  );\n}\n`,
      },
      {
        path: 'src/components/layout/site-footer.tsx',
        content: `export function SiteFooter() {\n  return <footer className="site-footer">Forjex · A little structure. Plenty of possibility.</footer>;\n}\n`,
      },
      {
        path: 'src/features/home/components/counter.tsx',
        content: `'use client';\n\nimport { Button } from '@/components/ui/button';\nimport { useCounter } from '@/hooks/use-counter';\nimport { formatCount } from '@/utils/format';\n\nexport function Counter() {\n  const { count, increment, reset } = useCounter();\n  return (\n    <div className="counter">\n      <Button className="secondary" onClick={reset}>Reset</Button>\n      <output aria-live="polite" aria-label="Counter value">{formatCount(count)}</output>\n      <Button onClick={increment}>Increment</Button>\n    </div>\n  );\n}\n`,
      },
      {
        path: 'src/features/home/components/home-screen.tsx',
        content: `${next ? "import Link from 'next/link';\n" : ''}import { setupSteps } from '../data/setup-steps';\nimport { Counter } from './counter';\n\nexport function HomeScreen() {\n  return (\n    <main>\n      <section className="hero"><div><p className="eyebrow">THE FORJEX STARTER · ${label}</p><h1>Your next idea<br />starts with <span>Forjex.</span></h1><p className="hero-description">A thoughtful foundation for building, shipping, and making something your own. Start locally. Connect GitHub, add CI/CD, and deploy when you’re ready.</p><${next ? 'Link' : 'a'} className="button" href="/docs">Explore your starter ↗</${next ? 'Link' : 'a'}></div><div className="logo-stage" aria-hidden="true"><div className="logo-orbit"><svg className="hero-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"><path d="M12 2.5L2.5 7.5V17.5L12 22.5L21.5 17.5V7.5L12 2.5Z"/><path d="M12 2.5V12.5L21.5 7.5M2.5 7.5L12 12.5M17 10V15M12 12.5V22.5"/></svg></div><span className="logo-caption">A LITTLE STRUCTURE. ENDLESS POSSIBILITY.</span></div></section>\n      <section id="getting-started" className="cards" aria-label="Getting started">\n        {setupSteps.map(step => <article key={step.title} className="card"><h2>{step.title}</h2><p>{step.description}</p><code>{step.command}</code></article>)}\n      </section>\n      <section id="workspace" className="workspace"><div><h2>A place for every concern.</h2><p>Edit <code>${entry}</code> to start building. Try the counter to see a hook in action.</p></div><Counter /></section>\n    </main>\n  );\n}\n`,
      },
      {
        path: entry,
        content: next
          ? `import { HomeScreen } from '@/features/home/components/home-screen';\n\nexport default function HomePage() {\n  return <HomeScreen />;\n}\n`
          : `import { SiteHeader } from '@/components/layout/site-header';\nimport { SiteFooter } from '@/components/layout/site-footer';\nimport { HomeScreen } from '@/features/home/components/home-screen';\nimport { StarterDocs } from '@/features/docs/starter-docs';\n\nexport default function App() {\n  return <><SiteHeader />{window.location.pathname.replace(/\\/$/, '') === '/docs' ? <StarterDocs /> : <HomeScreen />}<SiteFooter /></>;\n}\n`,
      },
    );
  }
  if (next) {
    files.push(
      {
        path: 'next-env.d.ts',
        content:
          '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n',
      },
      {
        path: 'next.config.ts',
        content:
          'import type { NextConfig } from "next";\nconst config: NextConfig = { reactStrictMode: true };\nexport default config;\n',
      },
      {
        path: 'src/app/layout.tsx',
        content: `import type { Metadata } from 'next';\nimport { SiteHeader } from '@/components/layout/site-header';\nimport { SiteFooter } from '@/components/layout/site-footer';\nimport { siteConfig } from '@/config/site';\nimport '@/styles/globals.css';\n\nexport const metadata: Metadata = { title: 'Forjex — Your next idea starts here', description: siteConfig.description, icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/favicon.ico', sizes: 'any' }] } };\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return <html lang="en"><body><SiteHeader />{children}<SiteFooter /></body></html>;\n}\n`,
      },
      {
        path: 'src/app/loading.tsx',
        content: `export default function Loading() {\n  return <main className="state" role="status"><div className="skeleton" aria-hidden="true" /><p>Loading your workspace…</p></main>;\n}\n`,
      },
      {
        path: 'src/app/error.tsx',
        content: `'use client';\n\nimport { Button } from '@/components/ui/button';\n\nexport default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {\n  return <main className="state"><h1>Something went wrong.</h1><p>Please try loading this page again.</p><Button onClick={reset}>Try again</Button></main>;\n}\n`,
      },
      {
        path: 'src/app/not-found.tsx',
        content: `import Link from 'next/link';\n\nexport default function NotFound() {\n  return <main className="state"><h1>Page not found.</h1><p>The page you requested does not exist.</p><Link className="button" href="/">Back home</Link></main>;\n}\n`,
      },
      {
        path: 'src/app/api/health/route.ts',
        content: `export function GET() {\n  return Response.json({ status: 'ok' });\n}\n`,
      },
    );
  } else {
    if (!vue)
      files.push({ path: 'src/vite-env.d.ts', content: '/// <reference types="vite/client" />\n' });
    files.push(
      {
        path: 'index.html',
        content: `<!doctype html>\n<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><link rel="icon" href="/favicon.ico" sizes="any" /><link rel="icon" type="image/svg+xml" href="/favicon.svg" /><title>Forjex — Your next idea starts here</title></head><body><div id="${vue ? 'app' : 'root'}"></div><script type="module" src="/src/main.${vue ? 'ts' : 'tsx'}"></script></body></html>\n`,
      },
      {
        path: 'vite.config.ts',
        content: `import { fileURLToPath, URL } from 'node:url';\nimport { defineConfig } from 'vite';\nimport ${vue ? 'vue' : 'react'} from '@vitejs/plugin-${vue ? 'vue' : 'react'}';\n\nexport default defineConfig({\n  plugins: [${vue ? 'vue' : 'react'}()],\n  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },\n});\n`,
      },
      ...(vue
        ? []
        : [
            {
              path: 'src/main.tsx',
              content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './styles/globals.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);\n`,
            },
          ]),
    );
  }
  files.push(...getGuideFiles(files, framework));
  return files;
}

export function getWebReadme(framework: string, name: string): string {
  return `# ${name}\n\nCreated with Forjex. Open \`/docs\` for the generated file guide. Customize the app name in \`src/config/site.ts\`.\n\n## Getting started\n\nUse Node.js 20.19 or newer.\n\n\`\`\`sh\nnpm install\ncp .env.example .env.local\nnpm run dev\n\`\`\`\n\n## Scripts\n\n- \`npm run dev\`: development server\n- \`npm run build\`: production build\n- \`npm run check\`: type checking, ESLint, and unit tests\n- \`npm test\`: run tests once\n- \`npm run test:watch\`: watch tests\n- \`npm run format\`: format source files\n\n## Structure\n\n- \`src/${framework === 'nextjs' ? 'app' : 'App.' + (framework === 'vue' ? 'vue' : 'tsx')}\`: application entry ${framework === 'nextjs' ? 'and route boundaries' : ''}\n- \`src/features\`: feature-specific components, data, and types\n- \`src/components\`: shared layout and UI components\n- \`src/${framework === 'vue' ? 'composables' : 'hooks'}\`: reusable state logic\n- \`src/config\` and \`src/constants\`: public environment and application settings\n- \`src/services\`: typed API client with JSON, error, and cancellation handling\n- \`src/lib\`, \`src/utils\`, and \`src/types\`: shared errors, pure helpers, and type contracts\n- \`src/styles\`: global styles and design tokens\n- \`tests\`: utility and API-client tests (mocked requests, no live provider)\n\n## Working conventions\n\nUse \`@/\` imports for shared modules. Keep feature-only code next to its feature. Server-side secrets must never use ${framework === 'nextjs' ? 'NEXT_PUBLIC_' : 'VITE_'} variables. The API client does not contact any backend until you call it. Configure the optional API origin in your local environment file.\n\n${framework === 'nextjs' ? 'The App Router includes loading, error, not-found, and health-route examples. Keep interactive code inside client components.\n\n' : ''}GitHub, CI/CD, and deployment are optional. Run \`npx forjex forge\` inside this folder when you are ready to connect a repository.\n`;
}

function getGuideFiles(files: TemplateFile[], framework: string): TemplateFile[] {
  const next = framework === 'nextjs';
  const vue = framework === 'vue';
  const guidePath = vue
    ? 'src/features/docs/StarterDocs.vue'
    : 'src/features/docs/starter-docs.tsx';
  const descriptions: Record<string, string> = {
    'package.json':
      'Project metadata, runtime dependencies, and the dev, build, check, test, and format commands.',
    'tsconfig.json':
      'Strict TypeScript checks and the @/ import alias. Update this when changing source boundaries.',
    'next.config.ts':
      'Next.js framework configuration. Add image hosts or other framework options here.',
    'next-env.d.ts':
      'Next.js generated framework type references. Keep application types in src/types instead.',
    'index.html':
      'Vite HTML entry, document title, favicon links, and the application mount point.',
    'vite.config.ts': 'Vite framework plugin, development server, build settings, and @/ alias.',
    'vitest.config.ts': 'Unit test discovery, Node test environment, and test import aliases.',
    'eslint.config.mjs':
      'TypeScript and framework lint rules used by npm run lint and npm run check.',
    '.editorconfig': 'Editor-independent indentation, encoding, and whitespace conventions.',
    '.prettierrc.json': 'Formatting rules used by npm run format.',
    '.prettierignore': 'Generated files and dependencies excluded from formatting.',
    '.env.example':
      'Example public API origin. Copy to .env.local; never put secrets in public environment variables.',
    '.gitignore': 'Keeps dependencies, generated output, and local environment files out of Git.',
    'README.md':
      'Local setup, scripts, structure, and working conventions for this generated project.',
    'src/config/site.ts':
      'Project name and public metadata. Replace the starter branding and hero when making this app your own.',
    'src/config/env.ts':
      'Reads the optional public API origin. These values are available to the browser.',
    'src/constants/routes.ts': 'Shared navigation destinations, including this documentation page.',
    'src/services/api-client.ts':
      'Typed JSON requests, response errors, and AbortSignal cancellation. No backend is called until you use it.',
    'src/lib/api-error.ts': 'Shared HTTP error with a status code for API consumers.',
    'src/utils/format.ts':
      'Pure number formatting helper, demonstrated by the counter and covered by unit tests.',
    'src/types/api.ts': 'API request option contract shared with the API client.',
    'src/types/navigation.ts': 'Label and destination contract used by site navigation.',
    'src/features/home/types.ts': 'Type contract for the getting-started command cards.',
    'src/features/home/data/setup-steps.ts':
      'Develop, verify, and build commands rendered on the home screen.',
    'src/app/page.tsx':
      'Home route. Composes the HomeScreen feature; start here to replace the welcome page.',
    'src/app/layout.tsx': 'Root HTML layout, global styles, metadata, shared header, and footer.',
    'src/app/loading.tsx': 'Loading boundary displayed while a route is being prepared.',
    'src/app/error.tsx': 'Interactive error boundary with a retry action.',
    'src/app/not-found.tsx': 'Fallback screen for missing routes.',
    'src/app/api/health/route.ts': 'Example server endpoint that returns a JSON health status.',
    'src/app/docs/page.tsx': 'Documentation route that renders the generated starter guide.',
    'src/App.tsx':
      'React application shell. Selects the home screen or /docs using the pathname; add a router as your app grows.',
    'src/App.vue':
      'Vue application shell. Selects the home screen or /docs using the pathname; add Vue Router as your app grows.',
    'src/main.tsx': 'Mounts the React application and loads global styles.',
    'src/main.ts': 'Mounts the Vue application and loads global styles.',
    'src/vite-env.d.ts': 'Vite client and import.meta.env type declarations.',
    'src/styles/globals.css':
      'Design tokens, responsive layouts, and the Forjex logo animation with reduced-motion support.',
    'public/forjex.svg': 'Forjex geometric brand mark used by the animated hero.',
    'public/favicon.svg': 'Scalable browser favicon with light and dark color support.',
    'public/favicon.ico': 'Multi-size browser favicon for ICO compatibility.',
    'src/app/favicon.ico': 'App Router browser favicon with multiple icon sizes.',
    'tests/format.test.ts': 'Tests number formatting, including zero and negative values.',
    'tests/api-client.test.ts':
      'Tests JSON serialization, cancellation, HTTP errors, and empty responses using mocked requests.',
    [guidePath]: 'Renders the starter documentation, command reference, and file guide.',
    'src/features/docs/file-guide.ts':
      'Generated inventory of the initial starter files. Update it when your project structure changes.',
  };
  const describe = (path: string) =>
    descriptions[path] ||
    (path.includes('/layout/')
      ? 'Shared site layout component used across the welcome and documentation pages.'
      : path.includes('/ui/')
        ? 'Reusable button primitive with native HTML attributes and shared styles.'
        : path.includes('/hooks/') || path.includes('/composables/')
          ? 'Reusable counter state, increment, and reset logic demonstrated by the home screen.'
          : path.includes('/home/components/')
            ? 'Home feature component demonstrating the welcome page or interactive counter.'
            : 'Framework support file for this starter.');
  const paths = [
    ...files.map((file) => file.path),
    guidePath,
    'src/features/docs/file-guide.ts',
    ...(next ? ['src/app/docs/page.tsx'] : []),
    '.gitignore',
    'README.md',
  ].sort();
  const inventory = paths.map((path) => ({ path, description: describe(path) }));
  const commands =
    '<section id="commands" class="docs-section"><h2>Build your first change</h2><p><code>npm run dev</code> starts the development server. <code>npm run check</code> runs types, lint, and unit tests. <code>npm run build</code> creates the production build. <code>npm run format</code> formats your files.</p></section><section id="shipping" class="docs-section"><h2>From local to live</h2><p>Run <code>npx forjex forge</code> in this project to connect GitHub, optionally add GitHub Actions, and deploy. Use <code>npx forjex push --ai</code> for later commits with an AI message, or <code>npx forjex push -m &quot;feat: describe your change&quot;</code> for your own message. AI requires an OpenAI API key in your terminal environment; keep it out of this browser app.</p><p>Configure your optional API origin in <code>.env.local</code>. Public environment variables are visible in the browser. This starter does not include a connected database or authentication service.</p></section>';
  const intro =
    '<div class="docs-intro"><p class="eyebrow">THE FORJEX FIELD GUIDE</p><h1>Know your foundation.</h1><p>A map of your generated starter. Learn where things live, make your first change, and take it to production. This inventory describes the initial files; keep it updated as your app grows.</p></div>';
  const aside =
    '<aside aria-label="Documentation sections"><a href="#commands">Getting started</a><a href="#files">Files &amp; folders</a><a href="#shipping">GitHub &amp; deployment</a></aside>';
  const markup =
    '<main>' +
    intro +
    '<div class="docs-layout">' +
    aside +
    '<div>' +
    commands +
    '<section id="files" class="docs-section"><h2>Files &amp; folders</h2>INVENTORY</section></div></div></main>';
  const result: TemplateFile[] = [
    {
      path: 'src/features/docs/file-guide.ts',
      content: `export const fileGuide = ${json(inventory)};\n`,
    },
    {
      path: guidePath,
      content: vue
        ? `<script setup lang="ts">\nimport { fileGuide } from './file-guide';\n</script>\n<template>\n${markup.replace('INVENTORY', '<dl class="file-guide"><div v-for="file in fileGuide" :key="file.path"><dt><code>{{ file.path }}</code></dt><dd>{{ file.description }}</dd></div></dl>')}\n</template>\n`
        : `import { fileGuide } from './file-guide';\n\nexport function StarterDocs() {\n  return (${markup.replaceAll('class=', 'className=').replace('INVENTORY', '<dl className="file-guide">{fileGuide.map(file => <div key={file.path}><dt><code>{file.path}</code></dt><dd>{file.description}</dd></div>)}</dl>')});\n}\n`,
    },
  ];
  if (next)
    result.push({
      path: 'src/app/docs/page.tsx',
      content: `import { StarterDocs } from '@/features/docs/starter-docs';\n\nexport const metadata = { title: 'Forjex — Starter documentation' };\nexport default function DocsPage() { return <StarterDocs />; }\n`,
    });
  return result;
}
