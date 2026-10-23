'use client';

import { CodeSnippet } from '@/components/ui/code-snippet';
import * as React from 'react';
import { TechnologyIcon, type Technology } from '@/components/ui/technology-icon';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';

interface TemplateItem {
  id: string;
  name: string;
  category: 'Full Stack' | 'Frontend' | 'Backend' | 'Systems';
  description: string;
  tags: string[];
  icon: Technology;
  cliCommand: string;
  docsSlug: string;
}

const TEMPLATES: TemplateItem[] = [
  {
    id: 'nextjs-app',
    docsSlug: 'nextjs',
    name: 'Next.js 15 App Router',
    category: 'Full Stack',
    description:
      'Next.js App Router with React 19, TypeScript, feature modules, shared layouts, tests, and lint tooling.',
    tags: ['React 19', 'TypeScript', 'App Router', 'Vercel'],
    icon: 'nextjs',
    cliCommand: 'forjex forge my-next-app --template nextjs --ci --vercel',
  },
  {
    id: 'vite-react',
    docsSlug: 'react',
    name: 'Vite + React SPA',
    category: 'Frontend',
    description: 'Supercharged single-page application with lightning HMR and modern tooling.',
    tags: ['React', 'Vite', 'TypeScript', 'Components'],
    icon: 'react-vite',
    cliCommand: 'forjex forge my-react-app --template react --ci --vercel',
  },
  {
    id: 'python-fastapi',
    docsSlug: 'python',
    name: 'Python FastAPI Service',
    category: 'Backend',
    description: 'FastAPI starter with health endpoints, interactive API docs, and pytest tests.',
    tags: ['Python', 'FastAPI', 'Uvicorn', 'Pytest'],
    icon: 'python',
    cliCommand: 'forjex forge my-fastapi --template python --ci',
  },
  {
    id: 'go-api',
    docsSlug: 'go',
    name: 'Go HTTP Service',
    category: 'Backend',
    description:
      'A standard-library HTTP service with JSON responses, a health endpoint, and a test starter.',
    tags: ['Go 1.22', 'HTTP', 'JSON', 'CI/CD'],
    icon: 'go',
    cliCommand: 'forjex forge my-go-api --template go --ci',
  },
  {
    id: 'rust-axum',
    docsSlug: 'rust',
    name: 'Rust Application',
    category: 'Systems',
    description: 'A minimal Cargo application with a main entry point and an initial unit test.',
    tags: ['Rust 2021', 'Cargo', 'Tests', 'CLI'],
    icon: 'rust',
    cliCommand: 'forjex forge my-rust-app --template rust --ci',
  },
  {
    id: 'vue-vite',
    docsSlug: 'vue',
    name: 'Vue 3 + Vite',
    category: 'Frontend',
    description:
      'Vue 3 Composition API with TypeScript, feature modules, shared layouts, tests, and lint tooling.',
    tags: ['Vue 3', 'Vite', 'Components', 'TypeScript'],
    icon: 'vue-vite',
    cliCommand: 'forjex forge my-vue-app --template vue --ci --vercel',
  },
];

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');

  const categories = ['All', 'Full Stack', 'Frontend', 'Backend', 'Systems'];

  const filteredTemplates =
    selectedCategory === 'All'
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === selectedCategory);

  return (
    <TooltipProvider>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="secondary" className="mb-2 uppercase tracking-widest text-[10px]">
            Template Gallery
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Production-Ready Starters
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2">
            Deploy high-performance project templates with pre-configured GitHub Actions CI/CD and
            Vercel hosting.
          </p>

          <div className="flex justify-center mt-6">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-auto">
              <TabsList className="grid grid-cols-5 h-9">
                {categories.map((cat) => (
                  <TabsTrigger key={cat} value={cat} className="text-xs">
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors group shadow-xs hover:shadow-md"
            >
              <div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-16 h-12 rounded-lg bg-neutral-200 dark:bg-neutral-900 flex items-center justify-center">
                      <TechnologyIcon technology={template.icon} size={30} />
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {template.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[10px] text-neutral-600 dark:text-neutral-400 font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </div>

              <CardFooter className="flex flex-col gap-3 border-t border-neutral-200 dark:border-neutral-800/80 pt-4">
                <CodeSnippet
                  code={template.cliCommand}
                  filename="Create this project"
                  className="w-full"
                />

                <Link
                  href={`/docs/installation/${template.docsSlug}`}
                  className="text-xs font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                >
                  Read the {template.name} guide
                </Link>

                <Link
                  href={template.docsSlug === 'vue' ? '/docs/installation/vue' : '/forge'}
                  className="w-full"
                >
                  <Button
                    variant="outline"
                    className="w-full justify-between text-xs group-hover:bg-neutral-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors"
                  >
                    <span>
                      {template.docsSlug === 'vue' ? 'Create with the CLI' : 'Forge this Stack'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
