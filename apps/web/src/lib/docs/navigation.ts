import type { Technology } from '@/components/ui/technology-icon';

export interface DocLink {
  slug: string;
  title: string;
  description: string;
  group: string;
  keywords?: string;
}
export const DOC_PAGES: DocLink[] = [
  {
    slug: '',
    title: 'Introduction',
    description: 'Find the right path for your next project.',
    group: 'Getting started',
  },
  {
    slug: 'installation',
    title: 'Installation',
    description: 'Install Forjex and choose your framework.',
    group: 'Getting started',
    keywords: 'setup npm pnpm yarn bun templates starters',
  },
  {
    slug: 'existing-project',
    title: 'Existing project',
    description: 'Use Forjex with application files you already have.',
    group: 'Getting started',
    keywords: 'repository connect import push git',
  },
  {
    slug: 'installation/nextjs',
    title: 'Next.js',
    description: 'Create an App Router application with React and TypeScript.',
    group: 'Framework guides',
  },
  {
    slug: 'installation/react',
    title: 'React + Vite',
    description: 'Create a React single-page application with TypeScript.',
    group: 'Framework guides',
  },
  {
    slug: 'installation/vue',
    title: 'Vue + Vite',
    description: 'Create a Vue application with the Composition API.',
    group: 'Framework guides',
  },
  {
    slug: 'installation/python',
    title: 'Python + FastAPI',
    description: 'Create an API with health endpoints and tests.',
    group: 'Framework guides',
  },
  {
    slug: 'installation/go',
    title: 'Go',
    description: 'Create a standard-library HTTP service.',
    group: 'Framework guides',
  },
  {
    slug: 'installation/rust',
    title: 'Rust',
    description: 'Create a minimal Cargo application.',
    group: 'Framework guides',
  },
  {
    slug: 'github',
    title: 'GitHub repositories',
    description: 'Create a repository or connect an existing one.',
    group: 'Build & ship',
    keywords: 'git commit push smart messages AI OpenAI',
  },
  {
    slug: 'ci-cd',
    title: 'Build checks & CI/CD',
    description: 'Check your build locally and automate checks on GitHub.',
    group: 'Build & ship',
    keywords: 'actions workflow tests pipeline',
  },
  {
    slug: 'deployment',
    title: 'Deploy to Vercel',
    description: 'Deploy a frontend and understand deployment status.',
    group: 'Build & ship',
    keywords: 'hosting ready production',
  },
  {
    slug: 'web-wizard',
    title: 'Browser wizard',
    description: 'Create and connect repositories from the Forjex website.',
    group: 'Build & ship',
    keywords: 'cloud demo preview templates dashboard AI commit messages OpenAI API key',
  },
  {
    slug: 'cli',
    title: 'CLI reference',
    description: 'Commands, arguments, and supported options.',
    keywords: 'create forge push AI commit message no-setup OPENAI_API_KEY FORJEX_AI_MODEL',
    group: 'Reference',
  },
  {
    slug: 'authentication',
    title: 'Authentication',
    description: 'Connect GitHub and Vercel when you need them.',
    group: 'Reference',
    keywords: 'login logout whoami token credentials security',
  },
  {
    slug: 'sync',
    title: 'Dashboard & sync',
    description: 'View repositories and sync them with your account.',
    group: 'Reference',
    keywords: 'projects history database cloud',
  },
  {
    slug: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Resolve common setup, build, and connection problems.',
    group: 'Reference',
    keywords: 'errors help unknown command install failed',
  },
];

export const docHref = (slug: string) => (slug ? `/docs/${slug}` : '/docs');

export interface FrameworkGuide {
  slug: string;
  name: string;
  technology: Technology;
  template: string;
  summary: string;
  requirements: string;
  commands: string;
  edit: string;
  verify: string;
  includes: string[];
  webWizard: boolean;
}
export const FRAMEWORKS: FrameworkGuide[] = [
  {
    slug: 'nextjs',
    name: 'Next.js',
    technology: 'nextjs',
    template: 'nextjs',
    summary: 'App Router, React 19, and TypeScript.',
    requirements:
      'Node.js 20.19 or newer and npm. Git is needed only when you connect a repository.',
    commands: 'npm run dev',
    edit: 'src/app/page.tsx',
    verify: 'npm run build',
    includes: [
      'App Router with root layout, loading, error, not-found, and health-route examples',
      'Feature-based components, shared layouts, and reusable UI',
      'Hooks, types, constants, environment settings, API client, and utility modules',
      'Unit tests, ESLint, Prettier, import aliases, and a multi-resolution favicon.ico',
    ],
    webWizard: true,
  },
  {
    slug: 'react',
    name: 'React + Vite',
    technology: 'react-vite',
    template: 'react',
    summary: 'React, Vite, and TypeScript for a single-page app.',
    requirements: 'Node.js 20.19 or newer and npm.',
    commands: 'npm run dev',
    edit: 'src/App.tsx',
    verify: 'npm run build',
    includes: [
      'React and Vite with feature-based components and shared layouts',
      'Reusable UI, typed hooks, constants, and configuration',
      'Typed API client, shared errors, utilities, and unit tests',
      'ESLint, Prettier, import aliases, environment example, and favicon.ico',
    ],
    webWizard: true,
  },
  {
    slug: 'vue',
    name: 'Vue + Vite',
    technology: 'vue-vite',
    template: 'vue',
    summary: 'Vue 3, the Composition API, and TypeScript.',
    requirements: 'Node.js 20.19 or newer and npm.',
    commands: 'npm run dev',
    edit: 'src/App.vue',
    verify: 'npm run build',
    includes: [
      'Vue single-file components with script setup and feature-based modules',
      'Shared layouts, reusable UI, composables, and types',
      'API client, shared errors, constants, configuration, and unit tests',
      'ESLint, Prettier, import aliases, environment example, and favicon.ico',
    ],
    webWizard: false,
  },
  {
    slug: 'python',
    name: 'Python + FastAPI',
    technology: 'python',
    template: 'python',
    summary: 'A small HTTP API with interactive docs and pytest.',
    requirements:
      'Node.js 20.19 or newer to run Forjex, plus Python 3.11 or newer with pip and venv.',
    commands:
      'python -m venv .venv\nsource .venv/bin/activate\npython -m pip install -r requirements.txt\nuvicorn main:app --reload',
    edit: 'main.py',
    verify: 'pytest',
    includes: [
      'FastAPI application with / and /health endpoints',
      'Interactive API documentation at /docs',
      'Pytest tests with the FastAPI test client',
      'requirements.txt for local dependency installation',
    ],
    webWizard: true,
  },
  {
    slug: 'go',
    name: 'Go',
    technology: 'go',
    template: 'go',
    summary: 'A JSON HTTP service using the Go standard library.',
    requirements: 'Node.js 20.19 or newer to run Forjex, plus Go 1.22 or newer.',
    commands: 'go run .',
    edit: 'main.go',
    verify: 'go test ./...\ngo build ./...',
    includes: [
      'Standard-library net/http server on port 8080',
      'JSON responses and a /health endpoint',
      'A starter HTTP handler test',
      'go.mod with no third-party framework dependency',
    ],
    webWizard: true,
  },
  {
    slug: 'rust',
    name: 'Rust',
    technology: 'rust',
    template: 'rust',
    summary: 'A minimal Cargo application you can build on.',
    requirements: 'Node.js 20.19 or newer to run Forjex, plus a stable Rust toolchain with Cargo.',
    commands: 'cargo run',
    edit: 'src/main.rs',
    verify: 'cargo test\ncargo build --release',
    includes: [
      'Cargo manifest and Rust 2021 application',
      'A main function with a Forjex greeting',
      'An initial unit test',
      'No web framework or third-party dependencies',
    ],
    webWizard: true,
  },
];

export const LEGACY_DOC_LINKS: Record<string, string> = {
  overview: '/docs',
  'quickstart-cli': '/docs/installation',
  'quickstart-cloud': '/docs/web-wizard',
  'cli-commands': '/docs/cli',
  'smart-commits': '/docs/github#commit-and-push',
  'build-checks': '/docs/ci-cd#local-build-check',
  'cloud-forge': '/docs/web-wizard',
  'cloud-sync': '/docs/sync',
  'project-history': '/docs/sync#dashboard',
  'cicd-pipelines': '/docs/ci-cd',
  'vercel-deployment': '/docs/deployment',
  troubleshooting: '/docs/troubleshooting',
};
