"use client";

import * as React from "react";
import Link from "next/link";
import {
  Terminal,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Search,
  Sparkles,
  GitBranch,
  Shield,
  ChevronsUpDown,
  Boxes,
  Tag,
  ChevronLeft,
  Menu,
  X,
  ArrowUpRight,
  Database,
  ArrowLeft,
} from "lucide-react";
import { GithubIcon, VercelIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { VSCodeBlock } from "@/components/ui/vscode-block";
import { PackageManagerBlock } from "@/components/ui/package-manager-block";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface DocNavCategory {
  title: string;
  items: { id: string; label: string }[];
}

const NAV_CATEGORIES: DocNavCategory[] = [
  {
    title: "Getting Started",
    items: [
      { id: "overview", label: "Overview" },
      { id: "quickstart-cli", label: "CLI Quickstart" },
      { id: "quickstart-cloud", label: "Cloud SaaS Quickstart" },
    ],
  },
  {
    title: "CLI Reference",
    items: [
      { id: "cli-commands", label: "CLI Commands & Options" },
      { id: "smart-commits", label: "Smart Commit Messages" },
      { id: "build-checks", label: "Pre-Flight Build Checks" },
    ],
  },
  {
    title: "Cloud Platform",
    items: [
      { id: "cloud-forge", label: "Cloud Forge Wizard" },
      { id: "cloud-sync", label: "CLI <-> Cloud Sync (Login)" },
      { id: "project-history", label: "Cloud Projects & History" },
    ],
  },
  {
    title: "DevOps & Hosting",
    items: [
      { id: "cicd-pipelines", label: "GitHub Actions CI/CD" },
      { id: "vercel-deployment", label: "Vercel Auto-Deployment" },
    ],
  },
  {
    title: "Help & Community",
    items: [
      { id: "troubleshooting", label: "Troubleshooting & FAQ" },
    ],
  },
];

const TOC_ITEMS = [
  { id: "overview", label: "What is Forjex?" },
  { id: "quickstart-cli", label: "CLI Quickstart" },
  { id: "quickstart-cloud", label: "Cloud SaaS Quickstart" },
  { id: "cli-commands", label: "CLI Commands (forge, login, sync)" },
  { id: "smart-commits", label: "Smart Commit Messages" },
  { id: "build-checks", label: "Pre-Flight Build Checks" },
  { id: "cloud-forge", label: "Cloud Forge Wizard" },
  { id: "cloud-sync", label: "CLI <-> Cloud Sync" },
  { id: "project-history", label: "Cloud Projects & History" },
  { id: "cicd-pipelines", label: "GitHub Actions CI/CD Matrix" },
  { id: "vercel-deployment", label: "Vercel Auto-Deployment" },
  { id: "troubleshooting", label: "Troubleshooting & FAQ" },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = React.useState("overview");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  // Track active section on scroll
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      for (let i = TOC_ITEMS.length - 1; i >= 0; i--) {
        const item = TOC_ITEMS[i];
        const element = document.getElementById(item.id);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(item.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredCategories = NAV_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="w-full flex-1 border-t border-neutral-200 dark:border-neutral-800">
      <div className="w-full flex">
        {/* MOBILE TOC TRIGGER BAR */}
        <div className="lg:hidden w-full px-4 sm:px-6 py-3 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 sticky top-14 bg-white/90 dark:bg-black/90 backdrop-blur-md z-30">
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300"
          >
            {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span>Menu &amp; Documentation Sections</span>
          </button>
          <span className="text-[11px] text-neutral-500 font-mono">
            {TOC_ITEMS.find((t) => t.id === activeSection)?.label || "Overview"}
          </span>
        </div>

        {/* ========================================================= */}
        {/* LEFT SIDEBAR NAVIGATION (Next.js Docs Style)               */}
        {/* ========================================================= */}
        <aside
          className={cn(
            "fixed inset-y-14 left-0 z-40 w-72 bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800/80 p-5 overflow-y-auto transition-transform duration-200 ease-in-out lg:sticky lg:top-14 lg:z-0 lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 lg:bg-transparent lg:dark:bg-transparent lg:w-68 xl:w-72 lg:shrink-0 lg:p-0 lg:py-6 lg:pl-4 sm:lg:pl-6 lg:pr-5",
            mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          {/* Top Switcher Widgets like Next.js */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                  <Boxes className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                    CLI &amp; Cloud Mode
                  </div>
                  <div className="text-[10px] text-neutral-500 truncate">
                    Unified Automation
                  </div>
                </div>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-1" />
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                  <Tag className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                    Latest Version
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    v1.6.4 (Production)
                  </div>
                </div>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-1" />
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative mb-5">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
            <kbd className="absolute right-2 top-2 px-1 py-0.5 text-[9px] font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
              ⌘K
            </kbd>
          </div>

          {/* Nav Categories */}
          <nav className="space-y-5">
            {filteredCategories.map((category) => (
              <div key={category.title}>
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-white mb-2 px-2.5 tracking-tight">
                  {category.title}
                </h3>
                <ul className="space-y-0.5">
                  {category.items.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          onClick={() => {
                            setActiveSection(item.id);
                            setMobileNavOpen(false);
                          }}
                          className={cn(
                            "flex items-center justify-between px-2.5 py-1.5 rounded-md text-[13px] transition-colors",
                            isActive
                              ? "font-medium text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800/80"
                              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                          )}
                        >
                          <span className="truncate">{item.label}</span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-white" />
                          )}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="pt-6 mt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center justify-between px-2.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <span>Projects Dashboard</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href="https://github.com/daviddozie/forjex"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-2.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <GithubIcon className="w-3.5 h-3.5" />
                <span>GitHub Repository</span>
              </span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* MAIN DOCUMENTATION CONTENT                                */}
        {/* ========================================================= */}
        <main className="flex-1 min-w-0 px-6 sm:px-10 lg:px-12 py-8 max-w-4xl space-y-16">
          {/* OVERVIEW */}
          <section id="overview" className="scroll-mt-20 space-y-4">
            <div>
              <Link
                href="/docs"
                className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors mb-3 group font-mono"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 dark:text-neutral-500 dark:group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
                <span>Docs</span>
                <span className="text-neutral-400 dark:text-neutral-600">/</span>
                <span className="text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white">Getting Started</span>
              </Link>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                Forjex Documentation
              </h1>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                Welcome to Forjex. Learn how to automate GitHub repository initialization, pre-flight build validation, automated CI/CD pipelines, and zero-config Vercel edge deployments.
              </p>
            </div>

            <div className="border-b border-neutral-200 dark:border-neutral-800/80 pb-6">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                What is Forjex?
              </h2>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                <strong>Forjex</strong> simplifies the setup of modern web and backend applications into a single terminal command or a one-click cloud flow. It eliminates the manual friction of initializing Git, configuring <code>.gitignore</code>, crafting multi-framework GitHub Actions CI/CD workflows, and linking Vercel production edge deployments.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
                <div className="flex items-center gap-2 font-semibold text-xs text-neutral-900 dark:text-white mb-1.5">
                  <Terminal className="w-4 h-4 text-emerald-500" />
                  <span>CLI Mode</span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Best for local terminal workflow when working inside an existing folder on your machine.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
                <div className="flex items-center gap-2 font-semibold text-xs text-neutral-900 dark:text-white mb-1.5">
                  <Flame className="w-4 h-4 fill-current text-amber-500" />
                  <span>Cloud SaaS Mode</span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Best for instantaneous project scaffolding, starter template selection, and team management.
                </p>
              </div>
            </div>
          </section>

          {/* CLI QUICKSTART */}
          <section id="quickstart-cli" className="scroll-mt-20 space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800/80">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-500" />
              <span>CLI Quickstart</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              Automate repository scaffolding and edge deployments directly from your terminal using your preferred package manager:
            </p>

            {/* Next.js style numbered steps */}
            <ol className="space-y-2 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 list-decimal list-inside leading-relaxed mb-4">
              <li>
                Install <code className="font-mono bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-1.5 py-0.5 rounded text-xs">forjex</code> using your package manager or run directly on-demand.
              </li>
              <li>
                <code className="font-mono bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-1.5 py-0.5 rounded text-xs">cd my-app</code> and start the Forge wizard.
              </li>
              <li>
                Visit <code className="font-mono bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-1.5 py-0.5 rounded text-xs">http://localhost:3000</code> to manage your cloud deployments.
              </li>
            </ol>

            {/* Package Manager Directive Tab */}
            <div className="space-y-2">
              <PackageManagerBlock />
            </div>

            {/* On-demand execution */}
            <div className="space-y-2 pt-4">
              <div className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>On-demand execution (without global install):</span>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  Zero Install
                </Badge>
              </div>
              <PackageManagerBlock
                commands={{
                  pnpm: "pnpm dlx forjex forge my-app --template nextjs",
                  npm: "npx forjex forge my-app --template nextjs",
                  yarn: "yarn dlx forjex forge my-app --template nextjs",
                  bun: "bunx forjex forge my-app --template nextjs",
                }}
              />
            </div>

            <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2.5 mt-4">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Zero-Config GitHub Device Authentication:</strong> On your first run, Forjex automatically initiates the GitHub Device OAuth flow. Confirm the 8-digit verification code in your browser, and your credentials are securely saved to <code className="font-mono bg-emerald-500/10 px-1 py-0.5 rounded text-[11px]">~/.forjex/config.json</code> without manual secret handling.
              </div>
            </div>
          </section>

          {/* CLOUD SAAS QUICKSTART */}
          <section id="quickstart-cloud" className="scroll-mt-20 space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800/80">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <Flame className="w-5 h-5 fill-current text-amber-500" />
              <span>Cloud SaaS Quickstart</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              Scaffold and deploy projects in seconds directly from your browser without touching the command line:
            </p>

            <ol className="space-y-3 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 list-decimal list-inside leading-relaxed">
              <li>
                Open the <Link href="/forge" className="underline font-medium text-neutral-900 dark:text-white">Cloud Forge Wizard</Link>.
              </li>
              <li>
                Choose between creating a <strong>New Repository</strong> or connecting an <strong>Existing GitHub Repo</strong>.
              </li>
              <li>
                Select your starter framework: Next.js 15, Vite + React, Python FastAPI, Go Fiber, or Rust Axum.
              </li>
              <li>
                Toggle <strong>GitHub Actions CI/CD</strong> and <strong>Vercel Auto-Deployment</strong>.
              </li>
              <li>
                Click <strong>Forge Project Now</strong> to watch live real-time execution and deployment.
              </li>
            </ol>
          </section>

          {/* CLI COMMANDS & OPTIONS */}
          <section id="cli-commands" className="scroll-mt-20 space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800/80">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-blue-500" />
              <span>CLI Commands &amp; Options</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              Forjex provides a concise set of high-leverage commands:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                <code className="font-mono font-semibold text-neutral-900 dark:text-white">forjex forge</code>
                <p className="text-neutral-500 mt-1">Interactive scaffolding: creates GitHub repo, initializes Git, commits .gitignore, configures CI/CD, and triggers Vercel deploy.</p>
              </div>

              <div className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                <code className="font-mono font-semibold text-neutral-900 dark:text-white">forjex login</code>
                <p className="text-neutral-500 mt-1">Authenticates your CLI with the Forjex Cloud Dashboard via browser session or direct PAT (<code>--token &lt;pat&gt;</code>).</p>
              </div>

              <div className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                <code className="font-mono font-semibold text-neutral-900 dark:text-white">forjex whoami</code>
                <p className="text-neutral-500 mt-1">Displays currently authenticated developer profile, active credentials, and cloud synchronization status.</p>
              </div>

              <div className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                <code className="font-mono font-semibold text-neutral-900 dark:text-white">forjex sync</code>
                <p className="text-neutral-500 mt-1">Fetches all projects persisted in your Cloud Dashboard and displays live deployment endpoints in terminal.</p>
              </div>

              <div className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                <code className="font-mono font-semibold text-neutral-900 dark:text-white">forjex logout</code>
                <p className="text-neutral-500 mt-1">Clears local stored session tokens from <code>~/.forjex/config.json</code>.</p>
              </div>
            </div>
          </section>

          {/* SMART COMMITS */}
          <section id="smart-commits" className="scroll-mt-20 space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800/80">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Smart Commit Messages</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              When committing staged or unstaged changes, Forjex automatically inspects modified filenames and generates accurate Conventional Commit messages (e.g. <code>feat: add user authentication</code>, <code>fix: resolve routing issue</code>, <code>chore: update dependencies</code>).
            </p>

            <CodeBlock
              filename="Generated Commit Example"
              code={`# Forjex inspects modified files and outputs:\nfeat: implement auth service and user session router\n\n# Files detected:\n# - src/services/auth.ts (New)\n# - src/routes/user.ts (Modified)\n# - package.json (Dependency updated)`}
            />
          </section>

          {/* BUILD CHECKS */}
          <section id="build-checks" className="scroll-mt-20 space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800/80">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span>Pre-Flight Build Checks</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              Before code is pushed to your remote repository, Forjex automatically executes your framework’s native validation scripts (<code>npm run build</code>, <code>cargo check</code>, <code>go build</code>, <code>pytest</code>). If compilation or tests fail, the push is prevented, protecting your production branches from breaking.
            </p>
          </section>

          {/* CLOUD FORGE WIZARD */}
          <section id="cloud-forge" className="scroll-mt-20 space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800/80">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <Flame className="w-5 h-5 fill-current text-amber-500" />
              <span>Cloud Forge Wizard</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              The <Link href="/forge" className="underline font-medium text-neutral-900 dark:text-white">Cloud Forge Wizard</Link> provides a 5-step visual walkthrough:
            </p>
            <ul className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300 list-disc list-inside">
              <li><strong>Repository Configuration</strong>: Name, description, public/private visibility.</li>
              <li><strong>Framework Selection</strong>: Next.js 15, Vite React, FastAPI, Go Fiber, Rust Axum.</li>
              <li><strong>DevOps Options</strong>: GitHub Actions CI/CD, Vercel edge deployment toggle.</li>
              <li><strong>Real-time Log Execution</strong>: Visual pipeline tracker with zero-drift guarantee.</li>
              <li><strong>Direct GitHub &amp; Vercel URLs</strong>: Immediate copy buttons and live deployment links.</li>
            </ul>
          </section>

          {/* CLI <-> CLOUD SYNC */}
          <section id="cloud-sync" className="scroll-mt-20 space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800/80">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-neutral-900 dark:text-white" />
              <span>CLI &lt;-&gt; Cloud Dashboard Sync</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              Authenticate your terminal with your Forjex Cloud account to ensure all repositories forged locally appear automatically on your web dashboard:
            </p>

            <PackageManagerBlock
              commands={{
                pnpm: `# 1. Initiate browser login from terminal\npnpm forjex login\n\n# 2. Check synced developer identity\npnpm forjex whoami\n\n# 3. Pull active cloud repositories\npnpm forjex sync`,
                npm: `# 1. Initiate browser login from terminal\nnpx forjex login\n\n# 2. Check synced developer identity\nnpx forjex whoami\n\n# 3. Pull active cloud repositories\nnpx forjex sync`,
                yarn: `# 1. Initiate browser login from terminal\nyarn forjex login\n\n# 2. Check synced developer identity\nyarn forjex whoami\n\n# 3. Pull active cloud repositories\nyarn forjex sync`,
                bun: `# 1. Initiate browser login from terminal\nbunx forjex login\n\n# 2. Check synced developer identity\nbunx forjex whoami\n\n# 3. Pull active cloud repositories\nbunx forjex sync`,
              }}
            />
          </section>

          {/* CLOUD PROJECTS & PERSISTENT HISTORY */}
          <section id="project-history" className="scroll-mt-20 space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800/80">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-500" />
              <span>Cloud Projects &amp; History</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              Every repository and edge deployment you forge — whether through the terminal (<code className="font-mono bg-neutral-100 dark:bg-neutral-900 px-1.5 py-0.5 rounded text-xs">forjex forge</code>) or the web app — is automatically indexed and synchronized to your persistent <Link href="/dashboard" className="underline font-medium text-neutral-900 dark:text-white">Cloud Dashboard</Link>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-1.5">
                <span className="font-semibold text-neutral-900 dark:text-white block">Instant Access</span>
                <p className="text-neutral-500 leading-relaxed">View live deployment URLs, GitHub repository links, and clone commands in one centralized dashboard without searching terminal history.</p>
              </div>

              <div className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-1.5">
                <span className="font-semibold text-neutral-900 dark:text-white block">Zero Configuration</span>
                <p className="text-neutral-500 leading-relaxed">No database setup or local config required. Projects sync automatically in the background whenever you forge a new codebase.</p>
              </div>

              <div className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-1.5">
                <span className="font-semibold text-neutral-900 dark:text-white block">Multi-Device Sync</span>
                <p className="text-neutral-500 leading-relaxed">Run <code className="font-mono text-[11px] bg-neutral-200 dark:bg-neutral-800 px-1 rounded">forjex sync</code> on any machine or CI server to immediately pull down your active repository list.</p>
              </div>
            </div>
          </section>

          {/* CI/CD PIPELINES WITH TABS */}
          <section id="cicd-pipelines" className="scroll-mt-20 space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800/80">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              <span>Generated GitHub Actions CI/CD</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              Forjex creates a fully configured <code>.github/workflows/ci.yml</code> workflow tailored to your project. Switch tabs to preview each multi-language matrix:
            </p>

            <VSCodeBlock
              defaultTabId="nextjs"
              className="mt-4"
              tabs={[
                {
                  id: "nextjs",
                  tabLabel: "ci.yml (Next.js)",
                  filename: "ci.yml",
                  language: "yaml",
                  code: `name: CI/CD Pipeline
on: [push, pull_request]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'
      - run: npm ci
      - run: npm run build`,
                },
                {
                  id: "python",
                  tabLabel: "ci.yml (FastAPI)",
                  filename: "ci.yml",
                  language: "yaml",
                  code: `name: Python FastAPI CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -r requirements.txt
      - run: pytest`,
                },
                {
                  id: "go",
                  tabLabel: "ci.yml (Go API)",
                  filename: "ci.yml",
                  language: "yaml",
                  code: `name: Go CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
      - run: go test -v ./...
      - run: go build -v ./...`,
                },
                {
                  id: "rust",
                  tabLabel: "ci.yml (Rust Axum)",
                  filename: "ci.yml",
                  language: "yaml",
                  code: `name: Rust CI
on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo check --verbose
      - run: cargo test --verbose`,
                },
              ]}
            />
          </section>

          {/* VERCEL AUTO-DEPLOY */}
          <section id="vercel-deployment" className="scroll-mt-20 space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800/80">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <VercelIcon className="w-5 h-5 text-neutral-900 dark:text-white" />
              <span>Vercel Auto-Deployment</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              Forjex creates a tailored <code>vercel.json</code> configuration and links your GitHub repository directly to Vercel via the API. Subsequent pushes to your default branch automatically trigger preview and production builds.
            </p>

            <VSCodeBlock
              defaultTabId="vercel-nextjs"
              className="mt-4"
              tabs={[
                {
                  id: "vercel-nextjs",
                  tabLabel: "vercel.json (Next.js)",
                  filename: "vercel.json",
                  path: "vercel.json",
                  language: "json",
                  code: `{\n  "version": 2,\n  "buildCommand": "npm run build",\n  "outputDirectory": ".next",\n  "framework": "nextjs"\n}`,
                },
                {
                  id: "vercel-vite",
                  tabLabel: "vercel.json (Vite/React)",
                  filename: "vercel.json",
                  path: "vercel.json",
                  language: "json",
                  code: `{\n  "version": 2,\n  "buildCommand": "npm run build",\n  "outputDirectory": "dist",\n  "framework": "vite"\n}`,
                },
                {
                  id: "vercel-python",
                  tabLabel: "vercel.json (Python)",
                  filename: "vercel.json",
                  path: "vercel.json",
                  language: "json",
                  code: `{\n  "version": 2,\n  "builds": [\n    {\n      "src": "main.py",\n      "use": "@vercel/python"\n    }\n  ],\n  "routes": [\n    {\n      "src": "/(.*)",\n      "dest": "main.py"\n    }\n  ]\n}`,
                },
              ]}
            />
          </section>

          {/* TROUBLESHOOTING WITH ACCORDION */}
          <section id="troubleshooting" className="scroll-mt-20 space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800/80">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Frequently Asked Questions &amp; Troubleshooting</span>
            </h2>
            <p className="text-xs text-neutral-500">
              Answers to common questions regarding authentication, repository conflicts, and deployment configuration:
            </p>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What if my repository already exists?</AccordionTrigger>
                <AccordionContent>
                  In both the CLI and Cloud Forge, you can select &quot;Connect Existing Repo&quot;. Forjex will link the remote URL, add CI/CD workflows and Vercel configs, and commit without overriding your existing commit history.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>How does GitHub authentication stay secure?</AccordionTrigger>
                <AccordionContent>
                  The CLI uses standard GitHub Device Flow OAuth, storing the scoped token in your local OS config directory (<code>~/.forjex/config.json</code>). The Cloud SaaS stores tokens in encrypted, HTTP-only, SameSite cookies. No passwords or tokens are stored in plain text or browser storage.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>Can I deploy to private GitHub organizations?</AccordionTrigger>
                <AccordionContent>
                  Yes! During GitHub OAuth, grant organization access when prompted by GitHub. You can then specify organization repository paths like <code>my-org/project-name</code>.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>What scopes are required for GitHub Personal Access Tokens?</AccordionTrigger>
                <AccordionContent>
                  Your token requires the <code>repo</code> scope (to initialize and commit files) and the <code>workflow</code> scope (to generate and manage GitHub Actions pipelines in <code>.github/workflows/</code>).
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>How does Vercel token linking work?</AccordionTrigger>
                <AccordionContent>
                  When you supply a Vercel token, Forjex calls the Vercel REST API (<code>POST /v9/projects</code>) to automatically connect the newly forged GitHub repository to your Vercel account with zero manual dashboard configuration.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </main>

        {/* ========================================================= */}
        {/* RIGHT SIDEBAR ("ON THIS PAGE" Next.js Style)              */}
        {/* ========================================================= */}
        <aside className="hidden xl:block w-60 xl:w-64 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-6 pl-6 pr-4 sm:pr-6 border-l border-neutral-200 dark:border-neutral-800/80">
          <div className="text-xs font-semibold text-neutral-900 dark:text-white mb-3 tracking-tight">
            On this page
          </div>

          <ul className="space-y-2 text-xs">
            {TOC_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "block transition-colors leading-snug",
                      isActive
                        ? "text-neutral-900 dark:text-white font-medium"
                        : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="pt-6 mt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-2.5 text-xs text-neutral-500">
            <a
              href="https://github.com/daviddozie/forjex"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <span>Edit this page on GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://github.com/daviddozie/forjex/issues"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <span>Report an issue</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
