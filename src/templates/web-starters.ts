import type { TemplateFile } from './content.js';
import { faviconIco } from './favicon';
import { getFoundationFiles, starterStyles } from './web-foundation';

const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><style>svg{color:#171717}@media(prefers-color-scheme:dark){svg{color:#fafafa}}</style><path d="M12 2.5L2.5 7.5V17.5L12 22.5L21.5 17.5V7.5L12 2.5Z"/><path d="M12 2.5V12.5L21.5 7.5M2.5 7.5L12 12.5M17 10V15M12 12.5V22.5"/></svg>`;

export function getWebTemplateFiles(framework: string, name: string): TemplateFile[] {
  const next = framework === 'nextjs';
  const vue = framework === 'vue';
  const label = next ? 'Next.js workspace' : vue ? 'Vue workspace' : 'React workspace';
  const entry = next ? 'src/app/page.tsx' : vue ? 'src/App.vue' : 'src/App.tsx';
  const files: TemplateFile[] = [
    ...getFoundationFiles(framework, name),
    {
      path: next ? 'src/app/favicon.ico' : 'public/favicon.ico',
      content: faviconIco,
      encoding: 'base64',
    },
    { path: 'public/favicon.svg', content: faviconSvg },
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
        content: `<script setup lang="ts">\nimport { siteConfig } from '@/config/site';\nimport { routes } from '@/constants/routes';\nimport type { NavigationItem } from '@/types/navigation';\nconst navigation: NavigationItem[] = [{ label: 'Get started', href: routes.gettingStarted }, { label: 'Workspace', href: routes.workspace }];\n</script>\n\n<template>\n  <header class="site-header">\n    <a class="brand" :href="routes.home">{{ siteConfig.name }}</a>\n    <nav aria-label="Main navigation"><a v-for="item in navigation" :key="item.href" :href="item.href">{{ item.label }}</a></nav>\n  </header>\n</template>\n`,
      },
      {
        path: 'src/components/layout/SiteFooter.vue',
        content:
          '<template>\n  <footer class="site-footer">A little structure. Plenty of possibility.</footer>\n</template>\n',
      },
      {
        path: 'src/features/home/components/AppCounter.vue',
        content: `<script setup lang="ts">\nimport BaseButton from '@/components/ui/BaseButton.vue';\nimport { useCounter } from '@/composables/use-counter';\nimport { formatCount } from '@/utils/format';\nconst { count, increment, reset } = useCounter();\n</script>\n\n<template>\n  <div class="counter">\n    <BaseButton class="secondary" @click="reset">Reset</BaseButton>\n    <output aria-live="polite" aria-label="Counter value">{{ formatCount(count) }}</output>\n    <BaseButton @click="increment">Increment</BaseButton>\n  </div>\n</template>\n`,
      },
      {
        path: 'src/features/home/components/HomeScreen.vue',
        content: `<script setup lang="ts">\nimport { siteConfig } from '@/config/site';\nimport { setupSteps } from '../data/setup-steps';\nimport AppCounter from './AppCounter.vue';\n</script>\n\n<template>\n  <main>\n    <section><p class="eyebrow">${label}</p><h1>{{ siteConfig.name }} starts here.</h1><p class="hero-description">A focused foundation for your next idea. Typed, tested, and ready to make your own.</p></section>\n    <section id="getting-started" class="cards" aria-label="Getting started">\n      <article v-for="step in setupSteps" :key="step.title" class="card"><h2>{{ step.title }}</h2><p>{{ step.description }}</p><code>{{ step.command }}</code></article>\n    </section>\n    <section id="workspace" class="workspace"><div><h2>A place for every concern.</h2><p>Edit <code>${entry}</code> to start building. Try the counter to see a composable in action.</p></div><AppCounter /></section>\n  </main>\n</template>\n`,
      },
      {
        path: 'src/App.vue',
        content: `<script setup lang="ts">\nimport SiteHeader from '@/components/layout/SiteHeader.vue';\nimport SiteFooter from '@/components/layout/SiteFooter.vue';\nimport HomeScreen from '@/features/home/components/HomeScreen.vue';\n</script>\n\n<template>\n  <SiteHeader />\n  <HomeScreen />\n  <SiteFooter />\n</template>\n`,
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
        content: `import { siteConfig } from '@/config/site';\nimport { routes } from '@/constants/routes';\nimport type { NavigationItem } from '@/types/navigation';\n${next ? "import Link from 'next/link';\n" : ''}\nconst navigation: NavigationItem[] = [\n  { label: 'Get started', href: routes.gettingStarted },\n  { label: 'Workspace', href: routes.workspace },\n];\n\nexport function SiteHeader() {\n  return (\n    <header className="site-header">\n      <${next ? 'Link' : 'a'} className="brand" href={routes.home}>{siteConfig.name}</${next ? 'Link' : 'a'}>\n      <nav aria-label="Main navigation">{navigation.map(item => <${next ? 'Link' : 'a'} key={item.href} href={item.href}>{item.label}</${next ? 'Link' : 'a'}>)}</nav>\n    </header>\n  );\n}\n`,
      },
      {
        path: 'src/components/layout/site-footer.tsx',
        content: `export function SiteFooter() {\n  return <footer className="site-footer">A little structure. Plenty of possibility.</footer>;\n}\n`,
      },
      {
        path: 'src/features/home/components/counter.tsx',
        content: `'use client';\n\nimport { Button } from '@/components/ui/button';\nimport { useCounter } from '@/hooks/use-counter';\nimport { formatCount } from '@/utils/format';\n\nexport function Counter() {\n  const { count, increment, reset } = useCounter();\n  return (\n    <div className="counter">\n      <Button className="secondary" onClick={reset}>Reset</Button>\n      <output aria-live="polite" aria-label="Counter value">{formatCount(count)}</output>\n      <Button onClick={increment}>Increment</Button>\n    </div>\n  );\n}\n`,
      },
      {
        path: 'src/features/home/components/home-screen.tsx',
        content: `import { siteConfig } from '@/config/site';\nimport { setupSteps } from '../data/setup-steps';\nimport { Counter } from './counter';\n\nexport function HomeScreen() {\n  return (\n    <main>\n      <section><p className="eyebrow">${label}</p><h1>{siteConfig.name} starts here.</h1><p className="hero-description">A focused foundation for your next idea. Typed, tested, and ready to make your own.</p></section>\n      <section id="getting-started" className="cards" aria-label="Getting started">\n        {setupSteps.map(step => <article key={step.title} className="card"><h2>{step.title}</h2><p>{step.description}</p><code>{step.command}</code></article>)}\n      </section>\n      <section id="workspace" className="workspace"><div><h2>A place for every concern.</h2><p>Edit <code>${entry}</code> to start building. Try the counter to see a hook in action.</p></div><Counter /></section>\n    </main>\n  );\n}\n`,
      },
      {
        path: entry,
        content: next
          ? `import { HomeScreen } from '@/features/home/components/home-screen';\n\nexport default function HomePage() {\n  return <HomeScreen />;\n}\n`
          : `import { SiteHeader } from '@/components/layout/site-header';\nimport { SiteFooter } from '@/components/layout/site-footer';\nimport { HomeScreen } from '@/features/home/components/home-screen';\n\nexport default function App() {\n  return <><SiteHeader /><HomeScreen /><SiteFooter /></>;\n}\n`,
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
        content: `import type { Metadata } from 'next';\nimport { SiteHeader } from '@/components/layout/site-header';\nimport { SiteFooter } from '@/components/layout/site-footer';\nimport { siteConfig } from '@/config/site';\nimport '@/styles/globals.css';\n\nexport const metadata: Metadata = { title: siteConfig.name, description: siteConfig.description, icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/favicon.ico', sizes: 'any' }] } };\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return <html lang="en"><body><SiteHeader />{children}<SiteFooter /></body></html>;\n}\n`,
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
        content: `<!doctype html>\n<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><link rel="icon" href="/favicon.ico" sizes="any" /><link rel="icon" type="image/svg+xml" href="/favicon.svg" /><title>${name.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)}</title></head><body><div id="${vue ? 'app' : 'root'}"></div><script type="module" src="/src/main.${vue ? 'ts' : 'tsx'}"></script></body></html>\n`,
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
  return files;
}

export function getWebReadme(framework: string, name: string): string {
  return `# ${name}\n\nCreated with Forjex. Application branding lives in the favicon; customize the app name in \`src/config/site.ts\`.\n\n## Getting started\n\nUse Node.js 20.19 or newer.\n\n\`\`\`sh\nnpm install\ncp .env.example .env.local\nnpm run dev\n\`\`\`\n\n## Scripts\n\n- \`npm run dev\`: development server\n- \`npm run build\`: production build\n- \`npm run check\`: type checking, ESLint, and unit tests\n- \`npm test\`: run tests once\n- \`npm run test:watch\`: watch tests\n- \`npm run format\`: format source files\n\n## Structure\n\n- \`src/${framework === 'nextjs' ? 'app' : 'App.' + (framework === 'vue' ? 'vue' : 'tsx')}\`: application entry ${framework === 'nextjs' ? 'and route boundaries' : ''}\n- \`src/features\`: feature-specific components, data, and types\n- \`src/components\`: shared layout and UI components\n- \`src/${framework === 'vue' ? 'composables' : 'hooks'}\`: reusable state logic\n- \`src/config\` and \`src/constants\`: public environment and application settings\n- \`src/services\`: typed API client with JSON, error, and cancellation handling\n- \`src/lib\`, \`src/utils\`, and \`src/types\`: shared errors, pure helpers, and type contracts\n- \`src/styles\`: global styles and design tokens\n- \`tests\`: utility and API-client tests (mocked requests, no live provider)\n\n## Working conventions\n\nUse \`@/\` imports for shared modules. Keep feature-only code next to its feature. Server-side secrets must never use ${framework === 'nextjs' ? 'NEXT_PUBLIC_' : 'VITE_'} variables. The API client does not contact any backend until you call it. Configure the optional API origin in your local environment file.\n\n${framework === 'nextjs' ? 'The App Router includes loading, error, not-found, and health-route examples. Keep interactive code inside client components.\n\n' : ''}GitHub, CI/CD, and deployment are optional. Run \`npx forjex forge\` inside this folder when you are ready to connect a repository.\n`;
}
