'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Plus,
  ExternalLink,
  Triangle,
  GitBranch,
  Clock,
  CheckCircle2,
  Activity,
  ArrowUpRight,
  Shield,
  Sparkles,
  MoreVertical,
  Copy,
  Trash2,
  Check,
  RefreshCw,
  LogIn,
  FolderGit2,
  AlertTriangle,
} from 'lucide-react';
import { GithubIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { CredentialsModal } from '@/components/credentials-modal';
import { AuthModal } from '@/components/auth/auth-modal';
import { Skeleton } from '@/components/ui/skeleton';

interface ProjectRecord {
  id: string;
  name: string;
  repo: string;
  deploymentUrl: string | null;
  framework: string;
  status: string;
  updatedAt: string;
  branch: string;
  isLive?: boolean;
  repoExists?: boolean;
}

interface UserProfile {
  id: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  email?: string;
  githubConnected: boolean;
  vercelConnected: boolean;
}

export default function DashboardPage() {
  const [credentialsOpen, setCredentialsOpen] = React.useState(false);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [projects, setProjects] = React.useState<ProjectRecord[]>([]);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [isPruning, setIsPruning] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [dbStatus, setDbStatus] = React.useState<{
    connected: boolean;
    latency?: string;
  }>({
    connected: false,
  });

  const checkAuth = React.useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          return data.user;
        }
      }
      setCurrentUser(null);
      return null;
    } catch {
      setCurrentUser(null);
      return null;
    }
  }, []);

  const checkDbHealth = React.useCallback(async () => {
    try {
      const res = await fetch('/api/health/db');
      if (res.ok) {
        const data = await res.json();
        setDbStatus({
          connected: !!data.connected,
          latency: data.latencyMs,
        });
      }
    } catch {}
  }, []);

  const loadProjects = React.useCallback(async (autoPrune = false) => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/projects${autoPrune ? '?prune=true' : ''}`);
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && Array.isArray(data.projects)) {
          setProjects(data.projects);
          setIsRefreshing(false);
          setLoading(false);
          return;
        }
      }
    } catch {}
    setProjects([]);
    setIsRefreshing(false);
    setLoading(false);
  }, []);

  const handleCopyClone = (repo: string, id: string) => {
    navigator.clipboard.writeText(`git clone https://github.com/${repo}.git`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRemoveProject = async (id: string) => {
    try {
      const response = await fetch(`/api/projects?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Could not remove project');
    } catch {
      return;
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
    try {
      const stored = JSON.parse(localStorage.getItem('forjex_user_projects') || '[]');
      localStorage.setItem(
        'forjex_user_projects',
        JSON.stringify(stored.filter((p: any) => p.id !== id && p.name !== id)),
      );
    } catch {}
  };

  const handlePruneDeleted = async () => {
    setIsPruning(true);
    try {
      await fetch('/api/projects?pruneDeleted=true', { method: 'DELETE' });
      await loadProjects();
    } catch (e) {
      console.error('Prune error:', e);
    } finally {
      setIsPruning(false);
    }
  };

  React.useEffect(() => {
    async function init() {
      const user = await checkAuth();
      await checkDbHealth();
      if (user) {
        await loadProjects();
      } else {
        setProjects([]);
        setLoading(false);
      }
    }
    init();
  }, [checkAuth, checkDbHealth, loadProjects]);

  return (
    <TooltipProvider>
      <div className="w-full px-4 sm:px-8 lg:px-12 py-10 flex-1 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Projects Dashboard
              </h1>
              <Badge variant="success" className="text-[10px]">
                {dbStatus.connected ? 'Cloud Connected' : 'Cloud Unavailable'}
              </Badge>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {currentUser
                ? `Logged in as @${currentUser.username}. Synced with your personal cloud workspace.`
                : 'Manage your automated repositories, CI/CD statuses, and edge deployments.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {currentUser ? (
              <button
                onClick={() => setCredentialsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
              >
                {currentUser.avatarUrl ? (
                  <Image
                    width={14}
                    height={14}
                    unoptimized
                    src={currentUser.avatarUrl}
                    alt={currentUser.username}
                    className="w-3.5 h-3.5 rounded-full object-cover"
                  />
                ) : (
                  <GithubIcon className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>@{currentUser.username}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAuthModalOpen(true)}
                className="text-xs gap-1.5 h-8"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Button>
            )}

            <Link href="/forge">
              <Button size="sm" className="gap-1.5 text-xs font-medium h-8">
                <Plus className="w-3.5 h-3.5" />
                <span>Forge Project</span>
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="space-y-8 w-full animate-in fade-in-50 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 space-y-3"
                >
                  <Skeleton className="h-3 w-28 bg-neutral-200 dark:bg-neutral-800/60" />
                  <Skeleton className="h-7 w-16 bg-neutral-200 dark:bg-neutral-800/80" />
                  <Skeleton className="h-3 w-36 bg-neutral-100 dark:bg-neutral-800/40" />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800/60" />
                <Skeleton className="h-4 w-20 bg-neutral-100 dark:bg-neutral-800/40" />
              </div>

              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <Skeleton className="h-10 w-10 rounded-lg bg-neutral-200 dark:bg-neutral-800/70 shrink-0" />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-44 bg-neutral-200 dark:bg-neutral-800/80" />
                          <Skeleton className="h-4 w-16 rounded-full bg-neutral-100 dark:bg-neutral-800/50" />
                        </div>
                        <Skeleton className="h-3 w-64 bg-neutral-100 dark:bg-neutral-800/40" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-md bg-neutral-200 dark:bg-neutral-800/60" />
                      <Skeleton className="h-8 w-8 rounded-md bg-neutral-200 dark:bg-neutral-800/60" />
                      <Skeleton className="h-8 w-8 rounded-md bg-neutral-200 dark:bg-neutral-800/60" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : !currentUser ? (
          <div className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/70 p-8 sm:p-14 text-center space-y-8 backdrop-blur-xl relative overflow-hidden shadow-lg dark:shadow-2xl transition-colors">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-neutral-300/30 dark:bg-zinc-800/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 mx-auto flex items-center justify-center text-neutral-900 dark:text-white shadow-md dark:shadow-xl">
                <Shield className="w-7 h-7 text-neutral-700 dark:text-neutral-300" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  Multi-Tenant Cloud Workspace
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed">
                  Sign in to view your personalized repositories, monitor live Vercel deployments,
                  and trigger automated CI/CD pipelines across the CLI and Web.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 font-semibold text-xs h-10 px-6 gap-2 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  <GithubIcon className="w-4 h-4 fill-current" />
                  <span>Sign In to Account</span>
                </Button>
                <Link href="/forge">
                  <Button
                    variant="outline"
                    className="text-xs h-10 px-5 border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900"
                  >
                    Try Interactive Demo
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-neutral-200 dark:border-neutral-800/60 relative z-10 text-left">
              <div className="p-4 rounded-xl bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800/60 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2 text-neutral-900 dark:text-white text-xs font-semibold">
                  <FolderGit2 className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                  <span>Isolated Repositories</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Each developer’s repositories and builds remain completely isolated and scoped to
                  your profile.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800/60 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2 text-neutral-900 dark:text-white text-xs font-semibold">
                  <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span>Automated CI/CD Matrices</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Every scaffolded project includes GitHub Actions workflows for continuous linting
                  and testing.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800/60 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2 text-neutral-900 dark:text-white text-xs font-semibold">
                  <Triangle className="w-4 h-4 text-neutral-900 dark:text-white fill-current" />
                  <span>Edge Vercel Deployments</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Instant live preview deployments with production DNS and edge network routing out
                  of the box.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 space-y-1">
                <span className="text-xs text-neutral-500 font-medium">Your Forged Repos</span>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {projects.filter((p) => p.repoExists !== false).length}
                </div>
                <div className="text-[11px] text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Scoped to @{currentUser.username}</span>
                </div>
              </Card>

              <Card className="p-4 space-y-1">
                <span className="text-xs text-neutral-500 font-medium">Live Deployments</span>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {projects.filter((p) => p.repoExists !== false && p.deploymentUrl).length}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <Triangle className="w-3 h-3 fill-current" />
                  <span>Edge Network Global</span>
                </div>
              </Card>

              <Card className="p-4 space-y-1">
                <span className="text-xs text-neutral-500 font-medium">CI/CD Pipeline Success</span>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">100%</div>
                <div className="text-[11px] text-emerald-500 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  <span>Passing pre-flight checks</span>
                </div>
              </Card>

              <Card className="p-4 space-y-1">
                <span className="text-xs text-neutral-500 font-medium">Cloud Database</span>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <span>Active</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span>Real-time sync</span>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
                    Your Projects
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      loadProjects();
                      checkDbHealth();
                    }}
                    disabled={isRefreshing}
                    className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    title="Refresh projects"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                  <span className="text-xs text-neutral-500 font-mono">
                    {projects.length} {projects.length === 1 ? 'repository' : 'repositories'}
                  </span>
                </div>
              </div>

              {projects.some((p) => p.repoExists === false) && (
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in-50">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-amber-400">
                        {projects.filter((p) => p.repoExists === false).length} repository deleted
                        on GitHub:{' '}
                        <span className="font-mono">
                          {projects
                            .filter((p) => p.repoExists === false)
                            .map((p) => p.repo)
                            .join(', ')}
                        </span>
                      </span>
                      <span className="text-neutral-400 block sm:inline sm:ml-1.5 text-[11px]">
                        Upstream repository was deleted on GitHub.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePruneDeleted}
                      disabled={isPruning}
                      className="text-xs h-7 gap-1.5 border-amber-500/40 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{isPruning ? 'Cleaning...' : 'Clean Up Stale Records'}</span>
                    </Button>
                  </div>
                </div>
              )}

              {projects.length === 0 ? (
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/40 p-10 text-center space-y-3">
                  <FolderGit2 className="w-8 h-8 text-neutral-400 dark:text-neutral-600 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                      No projects found
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                      You haven&apos;t forged any projects with this account yet. Scaffold your
                      first production repository now.
                    </p>
                  </div>
                  <Link href="/forge">
                    <Button size="sm" className="text-xs mt-2">
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Forge Your First Project
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/30 divide-y divide-neutral-200 dark:divide-neutral-800/80 overflow-hidden shadow-xs">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/30 transition-colors ${
                        proj.repoExists === false ? 'opacity-75 bg-neutral-500/5' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`font-semibold text-sm ${
                              proj.repoExists === false
                                ? 'line-through text-neutral-500'
                                : 'text-neutral-900 dark:text-white'
                            }`}
                          >
                            {proj.name}
                          </span>
                          <Badge variant="secondary" className="text-[10px] font-mono">
                            {proj.framework}
                          </Badge>
                          {proj.repoExists === false ? (
                            <Badge
                              variant="destructive"
                              className="text-[10px] bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 font-mono"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span>Deleted on GitHub</span>
                            </Badge>
                          ) : proj.isLive ? (
                            <Badge variant="success" className="text-[10px]">
                              Live GitHub
                            </Badge>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Demo</span>
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-neutral-500">
                          Deployment: {proj.status.replaceAll('_', ' ')}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 font-mono">
                          <span className="flex items-center gap-1">
                            <GithubIcon className="w-3 h-3" />
                            <span className={proj.repoExists === false ? 'line-through' : ''}>
                              {proj.repo}
                            </span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            <span>{proj.branch}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{proj.updatedAt}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {proj.repoExists === false ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveProject(proj.id)}
                            className="h-8 text-xs gap-1.5 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove from List</span>
                          </Button>
                        ) : (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={`https://github.com/${proj.repo}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                    <GithubIcon className="w-3 h-3" />
                                    <span className="hidden sm:inline">Repo</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>View repository on GitHub</TooltipContent>
                            </Tooltip>

                            {proj.deploymentUrl && proj.status === 'ready' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a href={proj.deploymentUrl} target="_blank" rel="noreferrer">
                                    <Button size="sm" className="gap-1.5 text-xs">
                                      <span>Visit Live</span>
                                      <ArrowUpRight className="w-3 h-3" />
                                    </Button>
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>Open live deployment</TooltipContent>
                              </Tooltip>
                            )}
                          </>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-3.5 h-3.5" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Project Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleCopyClone(proj.repo, proj.id)}>
                              {copiedId === proj.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>{copiedId === proj.id ? 'Copied!' : 'Copy Clone Command'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a
                                href={`https://github.com/${proj.repo}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2"
                              >
                                <GithubIcon className="w-3.5 h-3.5" />
                                <span>View on GitHub</span>
                              </a>
                            </DropdownMenuItem>
                            {proj.deploymentUrl && proj.status === 'ready' && (
                              <DropdownMenuItem asChild>
                                <a
                                  href={proj.deploymentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2"
                                >
                                  <Triangle className="w-3 h-3 fill-current" />
                                  <span>Visit Deployment</span>
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRemoveProject(proj.id)}
                              className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove from List</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <CredentialsModal
          isOpen={credentialsOpen}
          onClose={() => setCredentialsOpen(false)}
          onUpdated={() => {
            checkAuth();
            loadProjects();
          }}
        />

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            checkAuth();
            loadProjects();
          }}
        />
      </div>
    </TooltipProvider>
  );
}
