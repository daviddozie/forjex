'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GithubIcon, VercelIcon } from '@/components/ui/icons';
import {
  Shield,
  Key,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = React.useState<'oauth' | 'pat'>('oauth');
  const [githubPat, setGithubPat] = React.useState('');
  const [vercelToken, setVercelToken] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [oauthLoading, setOauthLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleOAuthClick = () => {
    setOauthLoading(true);
    setError(null);
    window.location.href = '/api/auth/github';
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubPat.trim()) {
      setError('Please enter your GitHub Personal Access Token.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/auth/pat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubPat: githubPat.trim(),
          vercelToken: vercelToken.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate with GitHub token.');
      }

      setSuccess(`Signed in successfully as @${data.user?.username || 'developer'}!`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSuccess(null);
        setGithubPat('');
        setVercelToken('');
      }, 900);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your token.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-[560px] sm:max-w-[580px] bg-white dark:bg-black/95 border-neutral-200 dark:border-zinc-800 text-neutral-900 dark:text-white backdrop-blur-2xl p-0 overflow-hidden shadow-2xl rounded-2xl">
        <div className="p-7 sm:p-9 pt-6 sm:pt-7">
          <DialogHeader className="mb-6 text-left">
            <DialogTitle className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
              Sign in to Forjex
            </DialogTitle>
            <DialogDescription className="text-sm text-neutral-500 dark:text-zinc-400 leading-relaxed">
              Access your cloud workspace, isolated repositories, and automated CI/CD deployments.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-200 animate-in fade-in-50 duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-200 animate-in fade-in-50 duration-200">
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
            <TabsList className="grid w-full grid-cols-2 bg-neutral-100 dark:bg-zinc-900/90 border border-neutral-200 dark:border-zinc-800 p-1 mb-6 rounded-xl h-11">
              <TabsTrigger
                value="oauth"
                className="text-xs sm:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white text-neutral-600 dark:text-zinc-400 transition-colors rounded-lg h-9 shadow-xs"
              >
                GitHub OAuth
              </TabsTrigger>
              <TabsTrigger
                value="pat"
                className="text-xs sm:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white text-neutral-600 dark:text-zinc-400 transition-colors rounded-lg h-9 shadow-xs"
              >
                Access Token (PAT)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="oauth" className="mt-0 space-y-5">
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800/80 space-y-3.5">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-full bg-white dark:bg-zinc-800/90 border border-neutral-200 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-xs">
                    <GithubIcon className="h-5 w-5 text-neutral-900 dark:text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                      1-Click GitHub Sign In
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      Authorizes repository scaffolding and CI/CD pipeline triggers.
                    </p>
                  </div>
                </div>

                <div className="text-[12px] text-neutral-500 dark:text-zinc-400 flex items-center gap-2 pt-2 border-t border-neutral-200 dark:border-zinc-800/60">
                  <Shield className="h-3.5 w-3.5 text-neutral-500 dark:text-zinc-400 shrink-0" />
                  <span>Your credentials are encrypted and scoped to your profile only.</span>
                </div>
              </div>

              <Button
                onClick={handleOAuthClick}
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

              <p className="text-center text-xs text-neutral-500 dark:text-zinc-400 pt-1">
                Prefer using your own Personal Access Token?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('pat')}
                  className="text-neutral-900 dark:text-zinc-200 underline underline-offset-2 hover:text-neutral-700 dark:hover:text-white transition-colors"
                >
                  Use Token
                </button>
              </p>
            </TabsContent>

            <TabsContent value="pat" className="mt-0">
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
                      Generate token <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <Input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx or github_pat_..."
                    value={githubPat}
                    onChange={(e) => setGithubPat(e.target.value)}
                    className="h-11 bg-white dark:bg-zinc-900/90 border-neutral-300 dark:border-zinc-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus-visible:ring-neutral-400 dark:focus-visible:ring-zinc-700 text-xs font-mono rounded-xl shadow-xs"
                    autoFocus
                  />
                  <p className="text-[11px] text-neutral-500 dark:text-zinc-400">
                    Requires scopes:{' '}
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
                      Vercel tokens <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <Input
                    type="password"
                    placeholder="Optional: for instant live Vercel deployments"
                    value={vercelToken}
                    onChange={(e) => setVercelToken(e.target.value)}
                    className="h-11 bg-white dark:bg-zinc-900/90 border-neutral-300 dark:border-zinc-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus-visible:ring-neutral-400 dark:focus-visible:ring-zinc-700 text-xs font-mono rounded-xl shadow-xs"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !githubPat.trim()}
                  className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-semibold text-xs transition-all duration-150 flex items-center justify-center gap-2 mt-3 rounded-xl shadow-md dark:shadow-lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Verifying Token...
                    </>
                  ) : (
                    <>
                      <Key className="h-3.5 w-3.5" />
                      Verify and Sign In
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
