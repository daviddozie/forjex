'use client';

import * as React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Key,
  Shield,
  Loader2,
  Trash2,
} from 'lucide-react';
import { GithubIcon, VercelIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function CredentialsModal({ isOpen, onClose, onUpdated }: CredentialsModalProps) {
  const [, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState<{
    github: { connected: boolean; user?: any; source?: string };
    vercel: { connected: boolean; user?: any; source?: string };
  }>({
    github: { connected: false },
    vercel: { connected: false },
  });

  const [githubPat, setGithubPat] = React.useState('');
  const [vercelPat, setVercelPat] = React.useState('');
  const [savingGithub, setSavingGithub] = React.useState(false);
  const [savingVercel, setSavingVercel] = React.useState(false);
  const [message, setMessage] = React.useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const fetchStatus = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/credentials');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setMessage(null);
    }
  }, [isOpen, fetchStatus]);

  const handleSaveGithub = async () => {
    if (!githubPat.trim()) return;
    setSavingGithub(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubToken: githubPat.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify GitHub token');

      setMessage({ text: 'GitHub token verified and saved!', type: 'success' });
      setGithubPat('');
      await fetchStatus();
      onUpdated?.();
    } catch (err: any) {
      setMessage({
        text: err.message || 'Failed to save GitHub token',
        type: 'error',
      });
    } finally {
      setSavingGithub(false);
    }
  };

  const handleSaveVercel = async () => {
    if (!vercelPat.trim()) return;
    setSavingVercel(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vercelToken: vercelPat.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify Vercel token');

      setMessage({ text: 'Vercel token verified and saved!', type: 'success' });
      setVercelPat('');
      await fetchStatus();
      onUpdated?.();
    } catch (err: any) {
      setMessage({
        text: err.message || 'Failed to save Vercel token',
        type: 'error',
      });
    } finally {
      setSavingVercel(false);
    }
  };

  const handleDisconnect = async (target: 'github' | 'vercel') => {
    try {
      await fetch(`/api/auth/credentials?target=${target}`, {
        method: 'DELETE',
      });
      setMessage({
        text: `Disconnected ${target === 'github' ? 'GitHub' : 'Vercel'}.`,
        type: 'success',
      });
      await fetchStatus();
      onUpdated?.();
    } catch (e: any) {
      setMessage({ text: e.message, type: 'error' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6 space-y-4">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-900 dark:text-white shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Cloud Integrations &amp; Tokens
              </DialogTitle>
              <DialogDescription className="text-xs">
                Connect GitHub &amp; Vercel to forge live repositories and deployments
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {message && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
              message.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GithubIcon className="w-4 h-4 text-neutral-900 dark:text-white" />
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                GitHub Integration
              </span>
            </div>
            {status.github.connected ? (
              <Badge variant="success" className="text-[10px]">
                Connected: @{status.github.user?.username}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">
                Not Connected
              </Badge>
            )}
          </div>

          {status.github.connected ? (
            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-neutral-500">
                Authorized for repository creation &amp; CI/CD workflows.
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect('github')}
                className="text-xs text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10 h-7 px-2.5 gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Disconnect</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <a href="/api/auth/github" className="block">
                <Button className="w-full gap-2 text-xs h-8">
                  <GithubIcon className="w-3.5 h-3.5" />
                  <span>Connect with GitHub OAuth</span>
                </Button>
              </a>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
                <span className="bg-white dark:bg-neutral-950 px-2 text-[10px] uppercase tracking-wider text-neutral-400 absolute">
                  or use Personal Access Token
                </span>
              </div>

              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="ghp_... (requires 'repo', 'workflow' scopes)"
                  value={githubPat}
                  onChange={(e) => setGithubPat(e.target.value)}
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveGithub}
                  disabled={savingGithub || !githubPat.trim()}
                  className="text-xs shrink-0"
                >
                  {savingGithub ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <VercelIcon className="w-4 h-4 text-neutral-900 dark:text-white" />
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                Vercel Integration
              </span>
            </div>
            {status.vercel.connected ? (
              <Badge variant="success" className="text-[10px]">
                Connected: @{status.vercel.user?.username}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">
                Not Connected
              </Badge>
            )}
          </div>

          {status.vercel.connected ? (
            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-neutral-500">
                Authorized to provision and deploy Vercel projects.
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect('vercel')}
                className="text-xs text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10 h-7 px-2.5 gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Disconnect</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Enter your Vercel Access Token:</span>
                <a
                  href="https://vercel.com/account/tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="text-neutral-700 dark:text-neutral-300 hover:underline flex items-center gap-1"
                >
                  <span>Create Token</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Vercel Access Token..."
                  value={vercelPat}
                  onChange={(e) => setVercelPat(e.target.value)}
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveVercel}
                  disabled={savingVercel || !vercelPat.trim()}
                  className="text-xs shrink-0"
                >
                  {savingVercel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 text-[11px] text-neutral-500 flex items-center gap-2 border-t border-neutral-200 dark:border-neutral-800">
          <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Tokens are encrypted and stored in secure HTTP-only session cookies.</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
