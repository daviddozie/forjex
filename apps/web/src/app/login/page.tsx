'use client';

import { ForjexIcon } from '@/components/ui/forjex-icon';
import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { GithubIcon, VercelIcon } from '@/components/ui/icons';
import {
  Shield,
  Key,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/dashboard';
  const errorParam = searchParams.get('error');
  const noticeParam = searchParams.get('notice');

  const [activeTab, setActiveTab] = React.useState<'oauth' | 'pat'>(
    noticeParam === 'no_oauth_secret' ? 'pat' : 'oauth',
  );
  const [githubPat, setGithubPat] = React.useState('');
  const [vercelToken, setVercelToken] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [oauthLoading, setOauthLoading] = React.useState(false);
  const [checkingAuth, setCheckingAuth] = React.useState(true);
  const [error, setError] = React.useState<string | null>(
    errorParam ? decodeURIComponent(errorParam) : null,
  );
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function checkCurrentSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            router.push(returnTo);
            return;
          }
        }
      } catch {
      } finally {
        setCheckingAuth(false);
      }
    }
    checkCurrentSession();
  }, [router, returnTo]);

  const handleOAuthLogin = () => {
    setOauthLoading(true);
    setError(null);
    window.location.href = `/api/auth/github?returnTo=${encodeURIComponent(returnTo)}`;
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubPat.trim()) {
      setError('Please provide your GitHub Personal Access Token.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubToken: githubPat.trim(),
          vercelToken: vercelToken.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify token.');
      }

      setSuccess('Authenticated successfully! Redirecting...');
      setTimeout(() => {
        router.push(returnTo);
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to save credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-neutral-500 dark:text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-900 dark:text-white" />
        <p className="text-xs">Checking session status...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 shadow-md dark:shadow-xl mb-4">
          <ForjexIcon className="h-6 w-6 text-neutral-900 dark:text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
          Sign in to Forjex
        </h1>
        <p className="text-sm text-neutral-600 dark:text-zinc-400">
          Scaffold, configure CI/CD, and deploy web applications directly from your cloud dashboard.
        </p>
      </div>

      <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-zinc-950/90 border border-neutral-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl backdrop-blur-xl transition-colors">
        {noticeParam === 'no_oauth_secret' && (
          <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-200 leading-relaxed">
            <span className="font-semibold text-amber-800 dark:text-amber-100">Notice: </span>
            OAuth App credentials are being set up on this instance. You can sign in immediately
            using your Personal Access Token below.
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
            <div className="flex-1 font-medium">{success}</div>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val as 'oauth' | 'pat');
            setError(null);
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-neutral-100 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-1 mb-6 rounded-xl h-11">
            <TabsTrigger
              value="oauth"
              className="text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white text-neutral-600 dark:text-zinc-400 transition-colors rounded-lg h-9 shadow-xs"
            >
              GitHub OAuth
            </TabsTrigger>
            <TabsTrigger
              value="pat"
              className="text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white text-neutral-600 dark:text-zinc-400 transition-colors rounded-lg h-9 shadow-xs"
            >
              Personal Access Token
            </TabsTrigger>
          </TabsList>

          <TabsContent value="oauth" className="space-y-4">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800/80 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-xs">
                  <GithubIcon className="h-5 w-5 text-neutral-900 dark:text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    One-click GitHub Sign In
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-0.5">
                    Connect your GitHub profile to manage live repositories and CI/CD pipelines.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleOAuthLogin}
              disabled={oauthLoading}
              className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-md dark:shadow-lg rounded-xl"
            >
              {oauthLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting to GitHub...
                </>
              ) : (
                <>
                  <GithubIcon className="h-4 w-4 fill-current" />
                  Continue with GitHub
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>

            <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-zinc-400 justify-center pt-2">
              <Shield className="h-3.5 w-3.5 text-neutral-400 dark:text-zinc-400" />
              <span>Each developer&apos;s workspace and projects remain strictly isolated.</span>
            </div>
          </TabsContent>

          <TabsContent value="pat">
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-neutral-500 dark:text-zinc-400" />
                    GitHub Personal Access Token <span className="text-red-500">*</span>
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=Forjex%20Cloud"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-neutral-500 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                  >
                    Generate <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx or github_pat_..."
                  value={githubPat}
                  onChange={(e) => setGithubPat(e.target.value)}
                  className="h-11 bg-white dark:bg-zinc-900 border-neutral-300 dark:border-zinc-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus-visible:ring-neutral-400 dark:focus-visible:ring-zinc-700 text-xs font-mono rounded-xl shadow-xs"
                  autoFocus
                />
                <p className="text-[11px] text-neutral-500 dark:text-zinc-400">
                  Required scopes:{' '}
                  <code className="text-neutral-800 dark:text-zinc-300 font-mono">repo</code> and{' '}
                  <code className="text-neutral-800 dark:text-zinc-300 font-mono">workflow</code>.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <VercelIcon className="h-3.5 w-3.5 text-neutral-500 dark:text-zinc-400" />
                    Vercel Token{' '}
                    <span className="text-neutral-400 dark:text-zinc-500">(Optional)</span>
                  </label>
                  <a
                    href="https://vercel.com/account/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-neutral-500 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                  >
                    Generate <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Input
                  type="password"
                  placeholder="Optional: for automatic production deployments"
                  value={vercelToken}
                  onChange={(e) => setVercelToken(e.target.value)}
                  className="h-11 bg-white dark:bg-zinc-900 border-neutral-300 dark:border-zinc-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus-visible:ring-neutral-400 dark:focus-visible:ring-zinc-700 text-xs font-mono rounded-xl shadow-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || !githubPat.trim()}
                className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-semibold text-xs transition-all duration-150 flex items-center justify-center gap-2 mt-2 rounded-xl shadow-md dark:shadow-lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Verifying Credentials...
                  </>
                ) : (
                  <>
                    <Key className="h-3.5 w-3.5" />
                    Authenticate Account
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-neutral-50 dark:bg-zinc-900/40 border border-neutral-200 dark:border-zinc-800/60 text-center">
        <p className="text-xs text-neutral-500 dark:text-zinc-400">
          Using the CLI? Run{' '}
          <code className="text-neutral-800 dark:text-zinc-200 font-mono bg-neutral-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
            forjex login
          </code>{' '}
          in your terminal.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 relative bg-white dark:bg-black transition-colors">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neutral-300/20 dark:bg-zinc-800/10 rounded-full blur-3xl pointer-events-none" />

      <Suspense
        fallback={
          <div className="min-h-[400px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400 dark:text-zinc-500" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
