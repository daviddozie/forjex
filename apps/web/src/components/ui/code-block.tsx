"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language = "bash",
  filename,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-950 text-neutral-100 font-mono text-xs overflow-hidden group shadow-lg",
        className
      )}
    >
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-900/60 text-neutral-400">
          <span className="text-xs font-mono">{filename}</span>
          <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono">
            {language}
          </span>
        </div>
      )}
      <div className="p-4 overflow-x-auto pr-12 text-sm leading-relaxed">
        <pre className="text-neutral-200 font-mono whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
      <div className="absolute top-3 right-3">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleCopy}
                aria-label="Copy code"
                className="p-1.5 rounded-md bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all cursor-pointer opacity-75 group-hover:opacity-100"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in duration-150" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {copied ? "Copied" : "Copy CLI Command"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
