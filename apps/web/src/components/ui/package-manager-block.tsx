"use client";

import * as React from "react";
import { Check, Copy, Terminal } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

interface PackageManagerBlockProps {
  commands?: {
    pnpm: string;
    npm: string;
    yarn: string;
    bun: string;
  };
  defaultManager?: PackageManager;
  className?: string;
}

const DEFAULT_COMMANDS: Record<PackageManager, string> = {
  pnpm: `pnpm add -g forjex
cd my-project
forjex forge`,
  npm: `npm install -g forjex
cd my-project
forjex forge`,
  yarn: `yarn global add forjex
cd my-project
forjex forge`,
  bun: `bun add -g forjex
cd my-project
forjex forge`,
};

export function PackageManagerBlock({
  commands = DEFAULT_COMMANDS,
  defaultManager = "pnpm",
  className,
}: PackageManagerBlockProps) {
  const [selectedPm, setSelectedPm] = React.useState<PackageManager>(defaultManager);
  const [copied, setCopied] = React.useState(false);

  // Load user's preferred package manager if saved
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("forjex_preferred_pm") as PackageManager;
      if (saved && ["pnpm", "npm", "yarn", "bun"].includes(saved)) {
        setSelectedPm(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSelectPm = (pm: PackageManager) => {
    setSelectedPm(pm);
    try {
      localStorage.setItem("forjex_preferred_pm", pm);
    } catch {
      // ignore
    }
  };

  const activeCode = commands[selectedPm] || commands.pnpm;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Syntax highlight terminal lines nicely (like Next.js docs)
  const renderHighlightedCode = (text: string) => {
    return text.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("#")) {
        return (
          <div key={idx} className="text-neutral-500 italic">
            {line}
          </div>
        );
      }

      // Format shell command line with colored tokens
      const parts = line.split(" ");
      return (
        <div key={idx} className="flex flex-wrap items-center gap-x-1.5 leading-relaxed font-mono">
          {parts.map((part, pIdx) => {
            if (pIdx === 0 && ["pnpm", "npm", "yarn", "bun", "npx", "bunx"].includes(part)) {
              return (
                <span key={pIdx} className="text-purple-400 font-semibold">
                  {part}
                </span>
              );
            }
            if (
              ["add", "install", "global", "dlx", "forge", "login", "whoami", "sync", "dev", "build"].includes(
                part
              )
            ) {
              return (
                <span key={pIdx} className="text-emerald-400 font-medium">
                  {part}
                </span>
              );
            }
            if (part.startsWith("-")) {
              return (
                <span key={pIdx} className="text-cyan-400">
                  {part}
                </span>
              );
            }
            return (
              <span key={pIdx} className="text-neutral-200">
                {part}
              </span>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className={cn("space-y-2 w-full", className)}>
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
        {(["pnpm", "npm", "yarn", "bun"] as PackageManager[]).map((pm) => {
          const isSelected = selectedPm === pm;
          return (
            <button
              key={pm}
              type="button"
              onClick={() => handleSelectPm(pm)}
              className={cn(
                "px-3 py-1 font-mono text-xs rounded-md transition-all cursor-pointer select-none",
                isSelected
                  ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900"
              )}
            >
              {pm}
            </button>
          );
        })}
      </div>

      {/* Terminal Block */}
      <div className="relative rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-950 text-neutral-100 font-mono text-xs overflow-hidden group shadow-lg">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-900/60 text-neutral-400 text-xs">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-neutral-500" />
            <span className="font-mono text-xs text-neutral-400">Terminal</span>
          </div>

          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleCopy}
                  aria-label="Copy terminal command"
                  className="flex items-center gap-1.5 p-1 px-2 rounded-md bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all cursor-pointer opacity-75 group-hover:opacity-100"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in duration-150" />
                      <span className="text-[11px] text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">{copied ? "Copied" : "Copy CLI Command"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-x-auto text-xs sm:text-sm leading-relaxed">
          {renderHighlightedCode(activeCode)}
        </div>
      </div>
    </div>
  );
}
