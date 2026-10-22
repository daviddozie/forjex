"use client";

import * as React from "react";
import { TechnologyIcon, type Technology } from "@/components/ui/technology-icon";
import {
  Flame,
  CheckCircle2,
  Circle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Triangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Terminal,
  ShieldCheck,
  Boxes,
  RotateCcw,
  Zap,
  Key,
  AlertCircle,
} from "lucide-react";
import { GithubIcon, VercelIcon } from "@/components/ui/icons";
import { CredentialsModal } from "@/components/credentials-modal";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { parseGitHubRepository } from "@/lib/github-repository";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  framework: string;
  icon: Technology;
  gitignore: string;
  buildCommand: string;
}

const TEMPLATES: Template[] = [
  {
    id: "nextjs",
    name: "Next.js 15 App Router",
    category: "Full Stack",
    description: "React 19, TypeScript, Tailwind CSS, Turbopack, and Shadcn ready",
    framework: "nextjs",
    icon: "nextjs",
    gitignore: "Node(JavaScript)",
    buildCommand: "npm run build",
  },
  {
    id: "vite-react",
    name: "Vite + React",
    category: "Frontend",
    description: "Ultra-fast frontend build with TypeScript and Tailwind CSS",
    framework: "react",
    icon: "react-vite",
    gitignore: "Node(JavaScript)",
    buildCommand: "npm run build",
  },
  {
    id: "python-fastapi",
    name: "Python FastAPI",
    category: "Backend / API",
    description: "High-performance modern Python API with Pydantic and Uvicorn",
    framework: "python",
    icon: "python",
    gitignore: "Python",
    buildCommand: "pytest",
  },
  {
    id: "go-api",
    name: "Go Fiber / Chi",
    category: "Backend",
    description: "Blazing fast compiled Go HTTP service with graceful shutdown",
    framework: "go",
    icon: "go",
    gitignore: "Go",
    buildCommand: "go build -v ./...",
  },
  {
    id: "rust-app",
    name: "Rust Axum Service",
    category: "Systems / Web",
    description: "Memory-safe, high-concurrency microservice with Tokio runtime",
    framework: "rust",
    icon: "rust",
    gitignore: "Rust",
    buildCommand: "cargo build --release",
  },
];

type WizardStep = "configure" | "template" | "pipelines" | "running" | "success";

interface ForgeExecutionLog {
  id: string;
  text: string;
  status: "pending" | "running" | "completed" | "failed";
  timestamp?: string;
}

export function ForgeWizard() {
  const [step, setStep] = React.useState<WizardStep>("configure");
  const [repoMode, setRepoMode] = React.useState<"new" | "existing">("new");
  const [repoName, setRepoName] = React.useState("my-forjex-project");
  const [description, setDescription] = React.useState("Modern app bootstrapped and deployed with Forjex");
  const [isPrivate, setIsPrivate] = React.useState(false);
  const [addReadme, setAddReadme] = React.useState(true);
  const [selectedTemplate, setSelectedTemplate] = React.useState<Template>(TEMPLATES[0]);
  const [addCICD, setAddCICD] = React.useState(true);
  const [deployVercel, setDeployVercel] = React.useState(true);
  const [existingRepoUrl, setExistingRepoUrl] = React.useState("");

  const existingRepo = React.useMemo(() => {
    try { return parseGitHubRepository(existingRepoUrl); }
    catch { return null; }
  }, [existingRepoUrl]);
  const targetName = repoMode === "existing" ? existingRepo?.repo || "repository" : repoName;

  // Running logs & progress
  const [executionLogs, setExecutionLogs] = React.useState<ForgeExecutionLog[]>([]);
  const [activeLogIndex, setActiveLogIndex] = React.useState(0);
  const [copiedCli, setCopiedCli] = React.useState(false);
  const [credentialsOpen, setCredentialsOpen] = React.useState(false);
  const [authStatus, setAuthStatus] = React.useState<{
    github: boolean;
    githubUsername?: string;
    vercel: boolean;
    vercelUsername?: string;
  }>({ github: false, vercel: false });
  const targetOwner = repoMode === "existing" ? existingRepo?.owner || "owner" : authStatus.githubUsername || "user";
  const [forgeResult, setForgeResult] = React.useState<{
    repoUrl: string | null;
    vercelUrl?: string;
    vercelDashboardUrl?: string;
    vercelImportUrl?: string;
    vercelLinked?: boolean;
    deploymentStatus?: string;
    isLive: boolean;
    owner: string;
    notice?: string;
    action?: "created" | "connected";
  } | null>(null);
  const [forgeError, setForgeError] = React.useState<string | null>(null);

  const checkAuth = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/credentials");
      if (res.ok) {
        const data = await res.json();
        setAuthStatus({
          github: !!data.github?.connected,
          githubUsername: data.github?.user?.username,
          vercel: !!data.vercel?.connected,
          vercelUsername: data.vercel?.user?.username,
        });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const runForgeProcess = async () => {
    setStep("running");
    setForgeError(null);
    setExecutionLogs([{ id: "request", text: "Waiting for repository setup results…", status: "running" }]);
    try {
      const res = await fetch("/api/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: targetName,
          repoMode,
          existingRepoUrl: repoMode === "existing" ? existingRepoUrl.trim() : undefined,
          addReadme,
          description,
          isPrivate,
          template: selectedTemplate.id,
          addCICD,
          deployVercel,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to forge project");
      }

      setExecutionLogs((prev) => prev.map((item) => ({ ...item, status: "completed" })));
      setForgeResult({
        repoUrl: data.repository.url,
        vercelUrl: data.deployment?.url,
        vercelDashboardUrl: data.deployment?.dashboardUrl,
        vercelImportUrl: data.deployment?.importUrl,
        vercelLinked: data.deployment?.linked,
        deploymentStatus: data.deployment?.status,
        isLive: data.mode === "live",
        owner: data.repository.owner,
        notice: data.notice,
        action: data.action,
      });

      setStep("success");

      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#ffffff", "#888888", "#38bdf8", "#818cf8"],
        });
      } catch (e) {
        // ignore
      }
    } catch (err: any) {
      setForgeError(err.message || "Failed to forge project");
      setStep("configure");
    }
  };

  const cliEquivalent = "forjex forge";

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliEquivalent);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const resetWizard = () => {
    setStep("configure");
    setRepoName("my-forjex-project");
    setRepoMode("new");
    setExistingRepoUrl("");
    setForgeResult(null);
    setForgeError(null);
    setExecutionLogs([]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black/60 backdrop-blur-md shadow-2xl overflow-hidden transition-all">
      {/* Wizard Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-900/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              Forjex Cloud Orchestrator
              <Badge variant="vercel" className="text-[10px]">
                v1.6
              </Badge>
            </h2>
            <p className="text-xs text-neutral-500">
              Interactive cloud deployment & repository automation
            </p>
          </div>
        </div>

        {/* Step Indicator Badges */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span
            className={cn(
              "px-2 py-0.5 rounded border transition-colors",
              step === "configure"
                ? "bg-neutral-900 text-white dark:bg-white dark:text-black border-transparent"
                : "text-neutral-400 border-neutral-200 dark:border-neutral-800"
            )}
          >
            1. Setup
          </span>
          <span className="text-neutral-400">→</span>
          <span
            className={cn(
              "px-2 py-0.5 rounded border transition-colors",
              step === "template"
                ? "bg-neutral-900 text-white dark:bg-white dark:text-black border-transparent"
                : "text-neutral-400 border-neutral-200 dark:border-neutral-800"
            )}
          >
            2. Stack
          </span>
          <span className="text-neutral-400">→</span>
          <span
            className={cn(
              "px-2 py-0.5 rounded border transition-colors",
              step === "pipelines"
                ? "bg-neutral-900 text-white dark:bg-white dark:text-black border-transparent"
                : "text-neutral-400 border-neutral-200 dark:border-neutral-800"
            )}
          >
            3. Deploy
          </span>
        </div>
      </div>

      {/* STEP 1: CONFIGURE */}
      {step === "configure" && (
        <div className="p-6 sm:p-8 space-y-6">
          {/* Error Alert */}
          {forgeError && (
            <div className="p-3.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Forging encountered an error</span>
                <p className="mt-0.5 text-neutral-600 dark:text-neutral-300">{forgeError}</p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
              Step 1: Choose Repository Action
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Select whether to bootstrap a brand new GitHub repository or connect to an existing project.
            </p>
          </div>

          {/* Mode Switcher Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setRepoMode("new")}
              className={cn(
                "p-4 rounded-lg border text-left cursor-pointer transition-all",
                repoMode === "new"
                  ? "border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-900/60 ring-1 ring-neutral-900 dark:ring-white"
                  : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 bg-transparent"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-neutral-900 dark:text-white">
                  Create New Repository
                </span>
                <span className="text-xs font-mono text-neutral-400">github-new</span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Initialize an empty GitHub repository with optional README, license, and starter framework templates.
              </p>
            </div>

            <div
              onClick={() => setRepoMode("existing")}
              className={cn(
                "p-4 rounded-lg border text-left cursor-pointer transition-all",
                repoMode === "existing"
                  ? "border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-900/60 ring-1 ring-neutral-900 dark:ring-white"
                  : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 bg-transparent"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-neutral-900 dark:text-white">
                  Connect Existing Repo
                </span>
                <span className="text-xs font-mono text-neutral-400">github-existing</span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Connect an existing GitHub repo to add GitHub Actions CI/CD workflows and automated Vercel deployment.
              </p>
            </div>
          </div>

          {/* Form Fields */}
          {repoMode === "new" ? (
            <div className="space-y-4 pt-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Repository Name <span className="text-red-500">*</span>
                  </label>
                  {authStatus.github ? (
                    <span className="text-[10px] text-emerald-500 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      @{authStatus.githubUsername}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCredentialsOpen(true)}
                      className="text-[10px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline font-mono cursor-pointer"
                    >
                      Connect GitHub
                    </button>
                  )}
                </div>
                <div className="flex items-center rounded-md border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-3 py-2 text-sm focus-within:ring-1 focus-within:ring-neutral-400">
                  <span className="text-neutral-400 text-xs font-mono mr-1">
                    github.com/{authStatus.githubUsername || "user"}/
                  </span>
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) =>
                      setRepoName(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-_]/g, "-")
                      )
                    }
                    placeholder="my-awesome-app"
                    className="w-full bg-transparent text-sm text-neutral-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short summary of this project..."
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-5 pt-2">
                {/* Private Toggle */}
                <label
                  htmlFor="private-checkbox"
                  className="flex items-center gap-2.5 cursor-pointer select-none group"
                >
                  <Checkbox
                    id="private-checkbox"
                    checked={isPrivate}
                    onCheckedChange={(checked) => setIsPrivate(checked === true)}
                  />
                  <span className="text-xs text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                    Make repository private
                  </span>
                </label>

                {/* Add README */}
                <label
                  htmlFor="readme-checkbox"
                  className="flex items-center gap-2.5 cursor-pointer select-none group"
                >
                  <Checkbox
                    id="readme-checkbox"
                    checked={addReadme}
                    onCheckedChange={(checked) => setAddReadme(checked === true)}
                  />
                  <span className="text-xs text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                    Generate README.md
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  GitHub Repository URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={existingRepoUrl}
                  onChange={(e) => setExistingRepoUrl(e.target.value)}
                  aria-label="GitHub Repository URL"
                  aria-invalid={Boolean(existingRepoUrl && !existingRepo)}
                  aria-describedby="existing-repo-hint"
                  placeholder="https://github.com/username/repository-name"
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-3 py-2 text-sm font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
                <p id="existing-repo-hint" className="text-xs text-neutral-500 mt-2">
                  {existingRepoUrl && !existingRepo ? "Use https://github.com/owner/repository." : "Requires write access. Existing source files, workflows, and Vercel configuration are preserved."}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Footer */}
          <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
            <Button
              onClick={() => setStep("template")}
              disabled={repoMode === "new" ? !repoName.trim() : !existingRepo}
              className="gap-2"
            >
              <span>Next: Select Stack</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: TEMPLATE / STACK */}
      {step === "template" && (
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
              Step 2: Choose Technology Stack
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {repoMode === "existing" ? "Choose the stack that matches your project to configure any missing CI and deployment files." : "Forjex configures the exact build scripts, .gitignore, and CI/CD matrices for your stack."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplate.id === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={cn(
                    "p-4 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between",
                    isSelected
                      ? "border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-900/60 ring-1 ring-neutral-900 dark:ring-white"
                      : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 bg-transparent"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <TechnologyIcon technology={tmpl.icon} size={22} className="h-7" />
                        <span className="font-semibold text-sm text-neutral-900 dark:text-white">
                          {tmpl.name}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {tmpl.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                    <span>build: {tmpl.buildCommand}</span>
                    <span>ignore: {tmpl.gitignore}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep("configure")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <Button onClick={() => setStep("pipelines")} className="gap-2">
              <span>Next: Pipelines & Deploy</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: PIPELINES & DEPLOY */}
      {step === "pipelines" && (
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
              Step 3: Automation & Cloud Hosting
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Enable continuous integration and automatic deployments to Vercel.
            </p>
          </div>

          <div className="space-y-4">
            {/* CI/CD Toggle */}
            <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950 flex items-start gap-4">
              <div className="mt-0.5">
                <Checkbox
                  id="cicd-checkbox"
                  checked={addCICD}
                  onCheckedChange={(checked) => setAddCICD(checked === true)}
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="cicd-checkbox"
                  className="text-sm font-semibold text-neutral-900 dark:text-white cursor-pointer flex items-center gap-2"
                >
                  <span>Add CI/CD Pipeline (GitHub Actions)</span>
                  <Badge variant="success" className="text-[10px]">
                    Recommended
                  </Badge>
                </label>
                <p className="text-xs text-neutral-500 mt-1">
                  Generates <code>.github/workflows/ci.yml</code> configured for {selectedTemplate.name}.
                  Runs automated testing and linting on pull requests and pushes to the repository’s default branch.
                </p>
              </div>
            </div>

            {/* Vercel Deployment Toggle */}
            <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950 flex items-start gap-4">
              <div className="mt-0.5">
                <Checkbox
                  id="vercel-checkbox"
                  checked={deployVercel}
                  onCheckedChange={(checked) => setDeployVercel(checked === true)}
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="vercel-checkbox"
                  className="text-sm font-semibold text-neutral-900 dark:text-white cursor-pointer flex items-center gap-2"
                >
                  <span>Deploy to Vercel</span>
                  <Badge variant="vercel" className="text-[10px]">
                    ▲ Edge Ready
                  </Badge>
                </label>
                <p className="text-xs text-neutral-500 mt-1">
                  Generates <code>vercel.json</code>, links the GitHub repository to your Vercel team,
                  and generates a live preview URL with auto-deployments on Git push.
                </p>
              </div>
            </div>

            {/* Cloud Execution Mode Status Card */}
            <div
              className={cn(
                "p-4 rounded-lg border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
                authStatus.github
                  ? "border-emerald-500/30 bg-emerald-500/5 text-neutral-800 dark:text-neutral-200"
                  : "border-amber-500/30 bg-amber-500/5 text-neutral-800 dark:text-neutral-200"
              )}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">
                  {authStatus.github ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                </div>
                <div>
                  <div className="font-semibold flex items-center gap-1.5 text-neutral-900 dark:text-white">
                    <span>
                      {authStatus.github
                        ? "Live Cloud Execution Active"
                        : "Simulation / Demo Mode"}
                    </span>
                    <Badge
                      variant={authStatus.github ? "success" : "secondary"}
                      className="text-[10px]"
                    >
                      {authStatus.github
                        ? `@${authStatus.githubUsername}`
                        : "No Tokens Configured"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {authStatus.github
                      ? repoMode === "existing" ? `Will connect ${targetOwner}/${targetName} and add missing configuration.` : `Will create real repository "${targetName}" on your GitHub account.`
                      : "Repositories will run in safe simulation mode unless you connect your GitHub credentials."}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCredentialsOpen(true)}
                className="shrink-0 text-xs h-7 gap-1.5 cursor-pointer"
              >
                <Key className="w-3 h-3" />
                <span>{authStatus.github ? "Manage Keys" : "Connect Accounts"}</span>
              </Button>
            </div>

            {/* Configuration Summary Box */}
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/40 p-4 text-xs font-mono space-y-1.5 text-neutral-600 dark:text-neutral-400">
              <div className="flex justify-between">
                <span>Repository:</span>
                <span className="text-neutral-900 dark:text-white font-semibold">
                  github.com/{targetOwner}/{targetName}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Template:</span>
                <span className="text-neutral-900 dark:text-white">{selectedTemplate.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Visibility:</span>
                <span className="text-neutral-900 dark:text-white">
                  {repoMode === "existing" ? "Keep current visibility" : isPrivate ? "Private" : "Public"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>GitHub Actions CI/CD:</span>
                <span className="text-emerald-500">{repoMode === "existing" ? addCICD ? "Add if missing" : "Keep current" : addCICD ? "Enabled" : "Disabled"}</span>
              </div>
              <div className="flex justify-between">
                <span>Vercel Auto-Deploy:</span>
                <span className="text-emerald-500">{repoMode === "existing" ? deployVercel ? "Connect" : "Keep current" : deployVercel ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep("template")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <Button
              onClick={runForgeProcess}
              className="gap-2 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 shadow-lg font-semibold"
            >
              <Flame className="w-4 h-4 fill-current text-amber-500" />
              <span>Forge Project Now</span>
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: RUNNING (LIVE ANIMATED PROGRESS) */}
      {step === "running" && (
        <div className="p-6 sm:p-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-pulse">
              <Flame className="w-6 h-6 text-amber-500 fill-current" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
              Configuring {targetName}...
            </h3>
            <p className="text-xs text-neutral-500">
              Waiting for GitHub and Vercel responses
            </p>
          </div>

          {/* Terminal / Stepper Logs */}
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-950 p-4 font-mono text-xs text-neutral-300 space-y-3 shadow-inner">
            {executionLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3">
                {log.status === "completed" && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                {log.status === "running" && (
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                )}
                {log.status === "pending" && (
                  <Circle className="w-4 h-4 text-neutral-600 shrink-0" />
                )}
                <span
                  className={cn(
                    log.status === "completed" && "text-neutral-200",
                    log.status === "running" && "text-amber-300 font-semibold",
                    log.status === "pending" && "text-neutral-600"
                  )}
                >
                  {log.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 5: SUCCESS */}
      {step === "success" && (
        <div className="p-6 sm:p-10 space-y-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                {forgeResult?.isLive ? forgeResult.action === "connected" ? "Repository Connected" : "Repository Created" : "Demo Preview Ready"}
              </h3>
              {forgeResult?.isLive && (
                <Badge variant="success" className="text-[10px]">
                  Live GitHub
                </Badge>
              )}
            </div>
            <p className="text-xs text-neutral-500">
              {forgeResult?.isLive
                ? `Your repository is live on GitHub under @${forgeResult.owner}.`
                : repoMode === "existing" ? "Connect GitHub to configure this repository." : "Connect your credentials to create this project."}
            </p>
          </div>

          {/* Optional notice if running in demo mode */}
          {forgeResult?.notice && (
            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-center gap-2 max-w-lg mx-auto">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{forgeResult.notice}</span>
            </div>
          )}

          {/* Outcome Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2">
            <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
                  <GithubIcon className="w-3.5 h-3.5" />
                  GitHub Repository
                </span>
                <Badge
                  variant={forgeResult?.isLive ? "success" : "secondary"}
                  className="text-[10px]"
                >
                  {forgeResult?.isLive
                    ? "Live on GitHub"
                    : "Demo"}
                </Badge>
              </div>
              <a
                href={forgeResult?.repoUrl || undefined}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-neutral-900 dark:text-white hover:underline flex items-center gap-1 font-mono break-all"
              >
                <span>
                  {(
                    forgeResult?.repoUrl ||
                    `https://github.com/${targetOwner}/${targetName}`
                  ).replace(/^https?:\/\//, "")}
                </span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
              <p className="text-[11px] text-neutral-500">
                {!forgeResult?.isLive ? repoMode === "existing" ? "Preview only: existing source files and configuration will be preserved." : "Preview only: the selected starter files will be generated after connecting GitHub." : forgeResult.action === "connected" ? "Existing source files preserved. Requested configuration checked." : <>Includes {selectedTemplate.name} code and .gitignore{addCICD ? ", plus GitHub Actions CI/CD" : ""}.</>}
              </p>
            </div>

            <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
                  <Triangle className="w-3 h-3 fill-current" />
                  Vercel Deployment
                </span>
                <Badge
                  variant={forgeResult?.vercelLinked ? "success" : "secondary"}
                  className="text-[10px]"
                >
                  {forgeResult?.vercelLinked
                    ? forgeResult.deploymentStatus?.replaceAll("_", " ") || "Linked"
                    : !forgeResult?.isLive
                    ? "Demo"
                    : deployVercel
                    ? "Setup Required"
                    : "Disabled"}
                </Badge>
              </div>

              {forgeResult?.vercelUrl && forgeResult.deploymentStatus === "ready" ? (
                <>
                  <a
                    href={forgeResult.vercelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-mono break-all"
                  >
                    <span>{(forgeResult.vercelUrl || "").replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-0.5">
                    <span>Active Production Endpoint</span>
                    {forgeResult.vercelDashboardUrl && (
                      <a
                        href={forgeResult.vercelDashboardUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white underline flex items-center gap-1"
                      >
                        Dashboard
                      </a>
                    )}
                  </div>
                </>
              ) : deployVercel && forgeResult?.isLive ? (
                <div className="space-y-2 pt-0.5">
                  <a
                    href={
                      (forgeResult?.vercelLinked ? forgeResult.vercelDashboardUrl : forgeResult?.vercelImportUrl) ||
                      `https://vercel.com/new/import?s=${
                        forgeResult?.repoUrl ||
                        `https://github.com/${targetOwner}/${targetName}`
                      }`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-semibold text-xs transition-all shadow-xs"
                  >
                    <Triangle className="w-3 h-3 fill-current" />
                    <span>{forgeResult?.vercelLinked ? "Check Deployment in Vercel" : "Deploy to Your Vercel Account"}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                  <p className="text-[11px] text-neutral-500 leading-tight">
                    Deployment status: {forgeResult?.deploymentStatus?.replaceAll("_", " ") || "awaiting setup"}. Open Vercel to continue.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-neutral-500">{deployVercel ? "Demo preview. No deployment has been created." : "Vercel deployment was not enabled for this project."}</p>
              )}
            </div>
          </div>

          {/* Dual-use: Copy CLI command */}
          <div className="pt-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-950 p-3 text-left">
            <div className="flex items-center justify-between mb-1.5 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>To set up an existing local project, run:</span>
              </span>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleCopyCli}
                      className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer p-1 rounded hover:bg-neutral-800 transition-colors"
                      aria-label="Copy CLI command"
                    >
                      {copiedCli ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {copiedCli ? "Copied" : "Copy CLI Command"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <code className="text-xs font-mono text-neutral-800 dark:text-neutral-200 block truncate">
              {cliEquivalent}
            </code>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={resetWizard} className="gap-2">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Forge Another Project</span>
            </Button>
            {forgeResult?.repoUrl && (
              <a href={forgeResult.repoUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" className="gap-2"><GithubIcon className="w-3.5 h-3.5" />Open on GitHub</Button>
              </a>
            )}
            {forgeResult?.vercelUrl && forgeResult.deploymentStatus === "ready" && (
              <a href={forgeResult.vercelUrl} target="_blank" rel="noreferrer">
                <Button className="gap-2">Visit Live App<ExternalLink className="w-3.5 h-3.5" /></Button>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Cloud Credentials Modal */}
      <CredentialsModal
        isOpen={credentialsOpen}
        onClose={() => setCredentialsOpen(false)}
        onUpdated={checkAuth}
      />
    </div>
  );
}
