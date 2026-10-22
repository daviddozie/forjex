"use client";

import * as React from "react";
import {
  Terminal,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Database,
  Loader2,
  Sparkles,
} from "lucide-react";
import { GithubIcon, VercelIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function CliAuthPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      }
    >
      <CliAuthContent />
    </React.Suspense>
  );
}

function CliAuthContent() {
  const [session, setSession] = React.useState("");
  React.useEffect(() => {
    setSession(new URLSearchParams(window.location.hash.slice(1)).get("session") || "");
  }, []);

  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [authorized, setAuthorized] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [creds, setCreds] = React.useState<{
    github: { connected: boolean; user?: any };
    vercel: { connected: boolean; user?: any };
  }>({
    github: { connected: false },
    vercel: { connected: false },
  });

  const [manualGithubToken, setManualGithubToken] = React.useState("");
  const [manualVercelToken, setManualVercelToken] = React.useState("");

  React.useEffect(() => {
    async function loadCreds() {
      try {
        const res = await fetch("/api/auth/credentials");
        if (res.ok) {
          const data = await res.json();
          setCreds(data);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadCreds();
  }, []);

  const handleAuthorize = async () => {
    if (!session) {
      setError("Missing CLI session token. Please run 'forjex login' from your terminal.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Authorize on web server
      const res = await fetch("/api/auth/cli", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session,
          githubToken: manualGithubToken.trim() || undefined,
          vercelToken: manualVercelToken.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to authorize session");
      }

      setAuthorized(true);
    } catch (err: any) {
      setError(err.message || "Failed to authorize CLI session");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 flex-1 flex flex-col items-center justify-center">
      <Card className="w-full shadow-lg border-neutral-200 dark:border-neutral-800">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-3 border border-neutral-200 dark:border-neutral-800">
            <Terminal className="w-6 h-6 text-neutral-900 dark:text-white" />
          </div>
          <CardTitle className="text-xl font-bold text-neutral-900 dark:text-white">
            Authorize Forjex CLI
          </CardTitle>
          <p className="text-xs text-neutral-500 mt-1">
            Connect your terminal command line to Forjex Cloud SaaS.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {authorized ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                  CLI Successfully Authenticated!
                </h3>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  You can now close this browser tab and return to your terminal. Your forged repositories will automatically sync with the cloud.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Session info */}
              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Terminal Session:</span>
                  <span className="font-mono font-medium text-neutral-900 dark:text-white">
                    {session ? session.slice(0, 16) + "..." : "Unknown"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Authorization:</span>
                  <span className="font-mono text-neutral-600 dark:text-neutral-400">
                    Secure polling
                  </span>
                </div>
              </div>

              {/* Connected accounts detection */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Cloud Credentials:
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs">
                    <div className="flex items-center gap-2">
                      <GithubIcon className="w-4 h-4 text-neutral-900 dark:text-white" />
                      <span>GitHub</span>
                    </div>
                    {creds.github.connected ? (
                      <Badge variant="success" className="text-[10px] font-mono">
                        @{creds.github.user?.username}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-neutral-400">
                        Not connected
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs">
                    <div className="flex items-center gap-2">
                      <VercelIcon className="w-4 h-4 text-neutral-900 dark:text-white" />
                      <span>Vercel Edge</span>
                    </div>
                    {creds.vercel.connected ? (
                      <Badge variant="success" className="text-[10px] font-mono">
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-neutral-400">
                        Not connected
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Manual input if credentials not stored in browser cookies */}
              {!creds.github.connected && (
                <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <span className="text-[11px] text-neutral-500 block">
                    Optional: Provide your GitHub PAT to link immediately to your CLI:
                  </span>
                  <Input
                    type="password"
                    placeholder="ghp_... (requires 'repo', 'workflow')"
                    value={manualGithubToken}
                    onChange={(e) => setManualGithubToken(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              )}

              {/* Permissions list */}
              <div className="space-y-1.5 pt-1 text-[11px] text-neutral-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Synchronize forged repositories with your Cloud Dashboard</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Display active cloud deployments in CLI via forjex sync</span>
                </div>
              </div>
            </>
          )}
        </CardContent>

        {!authorized && (
          <CardFooter className="pt-0">
            <Button
              onClick={handleAuthorize}
              disabled={submitting || loading || !session}
              className="w-full gap-2 text-xs font-medium"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Authorizing Session...</span>
                </>
              ) : (
                <>
                  <span>Authorize Forjex CLI</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
