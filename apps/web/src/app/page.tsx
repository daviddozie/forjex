'use client';

import { ForjexIcon } from '@/components/ui/forjex-icon';
import * as React from 'react';
import { TechnologyIcon, type Technology } from '@/components/ui/technology-icon';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import {
  ArrowRight,
  Terminal,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Check,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CodeBlock } from '@/components/ui/code-block';
import { ForgeWizard } from '@/components/forge-wizard/forge-wizard';
import { PipelineAnimation } from '@/components/pipeline-animation';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { HeroBackground } from '@/components/hero-background';

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemAnim: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const heroCommand = 'npm install -g forjex && forjex forge';

function HeroCommand() {
  const [copyState, setCopyState] = React.useState<'idle' | 'copied' | 'error'>('idle');

  React.useEffect(() => {
    if (copyState !== 'copied') return;
    const timer = window.setTimeout(() => setCopyState('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const handleCopy = async () => {
    setCopyState('idle');
    try {
      await navigator.clipboard.writeText(heroCommand);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };

  const copyLabel =
    copyState === 'copied'
      ? 'Command copied'
      : copyState === 'error'
        ? 'Could not copy. Select the command to copy it manually.'
        : 'Copy CLI command';

  return (
    <div className="group relative overflow-hidden rounded-lg border border-neutral-300 bg-neutral-950 text-left font-mono text-xs text-neutral-100 shadow-lg dark:border-neutral-800">
      <div className="overflow-x-auto p-4 pr-14 text-sm leading-relaxed">
        <pre className="whitespace-pre font-mono text-neutral-200">
          <code>{heroCommand}</code>
        </pre>
      </div>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copyLabel}
              className="absolute right-3 top-3 cursor-pointer rounded-md bg-neutral-800/80 p-1.5 text-neutral-400 opacity-75 transition-all hover:bg-neutral-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 group-hover:opacity-100"
            >
              {copyState === 'copied' ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">{copyLabel}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {copyState === 'error' && (
        <p
          aria-hidden="true"
          className="px-4 pb-4 font-sans text-xs leading-relaxed text-amber-300"
        >
          {copyLabel}
        </p>
      )}
      <span role="status" className="sr-only">
        {copyState !== 'idle' ? copyLabel : ''}
      </span>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col items-center overflow-x-hidden relative">
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-20 text-center min-h-[620px] flex flex-col justify-center items-center">
        <HeroBackground />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
          <motion.div
            initial="hidden"
            animate="show"
            variants={staggerContainer}
            className="flex flex-col items-center"
          >
            <motion.div variants={itemAnim}>
              <Link
                href="/docs"
                className="group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100/90 dark:bg-neutral-900/60 backdrop-blur-md text-xs font-medium text-neutral-800 dark:text-neutral-200 mb-8 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-xs overflow-hidden"
              >
                <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                <span>Introducing Forjex Dual-Mode CLI</span>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            <motion.h1
              variants={itemAnim}
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-neutral-950 dark:text-white max-w-4xl mx-auto leading-[1.08]"
            >
              Automate GitHub Repos &amp;{' '}
              <span className="bg-gradient-to-r from-neutral-950 via-neutral-700 to-neutral-900 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
                Deployments in Seconds.
              </span>
            </motion.h1>

            <motion.p
              variants={itemAnim}
              className="mt-6 text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed"
            >
              The modern developer platform that scaffolds projects, provisions remote GitHub
              repositories, configures automated CI/CD pipelines, and deploys live to Vercel.
            </motion.p>

            <motion.div
              variants={itemAnim}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
            >
              <Link href="/forge" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto gap-2 font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  <ForjexIcon className="w-4 h-4 text-amber-500" />
                  <span>Launch Forge</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/docs" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto gap-2 border-neutral-300 dark:border-neutral-800 bg-white dark:bg-transparent text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                >
                  <Terminal className="w-4 h-4" />
                  <span>View Documentation</span>
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={itemAnim} className="mt-8 w-full max-w-md mx-auto">
              <HeroCommand />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7 }}
        className="w-full py-10 relative"
      >
        <PipelineAnimation />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-2 uppercase tracking-widest text-[10px]">
            Interactive Playground
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Experience the Forge
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-md mx-auto">
            Configure your stack, connect GitHub &amp; Vercel, and watch your project come to life.
          </p>
        </div>

        <ForgeWizard />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-neutral-200 dark:border-neutral-800/80"
      >
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-2 uppercase tracking-widest text-[10px]">
            Dual-Mode Ecosystem
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Use It from Terminal or the Cloud
          </h2>
          <p className="text-sm text-neutral-500 mt-2">
            Seamlessly switch between terminal power and web dashboard capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SpotlightCard className="flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-700">
            <div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-neutral-200 dark:bg-neutral-900 flex items-center justify-center text-neutral-900 dark:text-white">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    CLI Binary
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                  Forjex CLI for Terminal Ninjas
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
                  Inspect local project files, auto-generate contextual conventional commit
                  messages, test builds locally, and push straight from your workflow.
                </p>
                <ul className="space-y-3 text-xs text-neutral-600 dark:text-neutral-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Interactive terminal prompts with Inquirer &amp; Chalk</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Smart commit message generation based on staged git diffs</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Pre-flight build check preventing broken code pushes</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      Seamless login via browser session (
                      <code className="text-[11px] font-mono">forjex login</code>)
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-neutral-200 dark:border-neutral-800 p-6 pt-4 bg-neutral-50/50 dark:bg-neutral-900/30">
              <CodeBlock code="forjex forge" language="bash" />
            </div>
          </SpotlightCard>

          <SpotlightCard className="flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-700">
            <div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">
                    <ForjexIcon className="w-5 h-5" />
                  </div>
                  <Badge variant="vercel" className="font-mono text-[10px]">
                    Cloud Platform
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                  Forjex Web Platform
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
                  Bootstrap full projects in the browser, share starter boilerplates with team
                  members, view deployment health, and manage cloud repos.
                </p>
                <ul className="space-y-3 text-xs text-neutral-600 dark:text-neutral-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Visual multi-step wizard with real-time status updates</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Curated production templates for Next.js, Vite, Python, Go, Rust</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Automatic GitHub Actions CI/CD workflows pushed to your repos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Instant Vercel project linkage and live edge deployments</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-neutral-200 dark:border-neutral-800 p-6 pt-4 bg-neutral-50/50 dark:bg-neutral-900/30">
              <Link href="/forge" className="w-full block">
                <Button className="w-full gap-2 font-medium">
                  <span>Open Forge</span>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </SpotlightCard>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-neutral-200 dark:border-neutral-800/80 text-center"
      >
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400 mb-8">
          Multi-Framework Scaffolding &amp; CI/CD Pipelines
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {(
            [
              { name: 'Next.js', desc: 'App Router & SSR', icon: 'nextjs' },
              { name: 'React / Vite', desc: 'Fast SPA Bundling', icon: 'react-vite' },
              { name: 'Python', desc: 'FastAPI / Flask', icon: 'python' },
              { name: 'Go', desc: 'Fiber / Chi API', icon: 'go' },
              { name: 'Rust', desc: 'Axum & Cargo', icon: 'rust' },
              { name: 'Node.js', desc: 'TypeScript & ESM', icon: 'nodejs' },
            ] satisfies { name: string; desc: string; icon: Technology }[]
          ).map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/40 text-center hover:border-neutral-400 dark:hover:border-neutral-700 transition-all cursor-default shadow-xs"
            >
              <TechnologyIcon technology={item.icon} size={30} className="h-10 mb-2" />
              <div className="font-semibold text-xs text-neutral-900 dark:text-white">
                {item.name}
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">{item.desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-neutral-200 dark:border-neutral-800/80"
      >
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-2 uppercase tracking-widest text-[10px]">
            Got Questions?
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Everything you need to know about Forjex and the CLI.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="faq-1">
            <AccordionTrigger>
              What makes Forjex different from running git init manually?
            </AccordionTrigger>
            <AccordionContent>
              Manual setup requires creating a repo on GitHub, setting up git remotes, crafting a
              language-specific .gitignore, writing complex GitHub Actions YAML workflows from
              scratch, configuring Vercel deployment targets, and testing builds. Forjex handles
              this entire lifecycle in a single command or single click with zero drift.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-2">
            <AccordionTrigger>Can I connect my own GitHub and Vercel credentials?</AccordionTrigger>
            <AccordionContent>
              Yes! Click the &quot;Connect&quot; button in the navbar to connect via GitHub OAuth or
              provide a Personal Access Token (PAT). You can also add your Vercel Access Token to
              enable instant zero-touch project provisioning.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-3">
            <AccordionTrigger>What if I don&apos;t connect any tokens?</AccordionTrigger>
            <AccordionContent>
              Forjex includes a full Simulation Mode that lets you explore the entire scaffolding
              wizard, preview generated GitHub Actions CI/CD workflows, copy CLI commands, and test
              project setups safely without needing any API keys.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-4">
            <AccordionTrigger>
              Is the CLI compatible with macOS, Linux, and Windows?
            </AccordionTrigger>
            <AccordionContent>
              Yes, Forjex is distributed as an ESM/CommonJS binary via npm and runs on all major
              platforms (macOS, Ubuntu/Debian, Fedora, Windows PowerShell/CMD) on Node.js 18+.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-5">
            <AccordionTrigger>How do pre-flight build checks work?</AccordionTrigger>
            <AccordionContent>
              Before committing or pushing, Forjex automatically detects your stack (e.g. Next.js,
              Vite, Cargo, Go) and executes your build checks. If a TypeScript error or test failure
              occurs, Forjex prevents broken commits from reaching your production branch.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <div className="relative rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-neutral-100 via-white to-neutral-100 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900 p-8 sm:p-12 text-center overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-mono">
              Get Started In Seconds
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Ready to automate your next project?
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Skip repetitive setup, manual GitHub repo creation, and CI/CD boilerplate. Launch from
              the browser or install the CLI.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/forge">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  <ForjexIcon className="w-4 h-4 text-amber-500" />
                  <span>Start Forging Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                  <Terminal className="w-4 h-4" />
                  <span>Explore CLI Commands</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
