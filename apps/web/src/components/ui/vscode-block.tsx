"use client";

import * as React from "react";
import {
  Check,
  Copy,
  FileCode,
  GitBranch,
  CheckCircle2,
  ChevronRight,
  Split,
  MoreHorizontal,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface VSCodeTab {
  id: string;
  filename: string;
  tabLabel: string;
  path?: string;
  language?: string;
  code: string;
}

interface VSCodeBlockProps {
  tabs: VSCodeTab[];
  defaultTabId?: string;
  className?: string;
}

export function VSCodeBlock({
  tabs,
  defaultTabId,
  className,
}: VSCodeBlockProps) {
  const [activeTabId, setActiveTabId] = React.useState(
    defaultTabId || tabs[0]?.id || ""
  );
  const [copied, setCopied] = React.useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleCopy = async () => {
    if (!activeTab) return;
    try {
      await navigator.clipboard.writeText(activeTab.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamic breadcrumb items
  const breadcrumbParts = React.useMemo(() => {
    if (!activeTab) return ["file"];
    const fullPath = activeTab.path || activeTab.filename;
    return fullPath.split("/").filter(Boolean);
  }, [activeTab]);

  // Syntax highlighting for YAML & JSON (VS Code Dark+ theme inspired)
  const renderLine = (line: string, index: number) => {
    const matchIndent = line.match(/^(\s*)/);
    const indent = matchIndent ? matchIndent[1] : "";
    const trimmed = line.slice(indent.length);

    let content: React.ReactNode = trimmed;

    if (trimmed.startsWith("#")) {
      content = <span className="text-neutral-500 italic">{trimmed}</span>;
    } else if (
      trimmed === "{" ||
      trimmed === "}" ||
      trimmed === "}," ||
      trimmed === "[" ||
      trimmed === "]" ||
      trimmed === "],"
    ) {
      content = <span className="text-yellow-400 font-semibold">{trimmed}</span>;
    } else if (trimmed.startsWith("- uses:")) {
      const rest = trimmed.replace("- uses:", "");
      content = (
        <>
          <span className="text-neutral-500">- </span>
          <span className="text-purple-400 font-medium">uses</span>
          <span className="text-neutral-400">:</span>
          <span className="text-amber-300 font-normal">{rest}</span>
        </>
      );
    } else if (trimmed.startsWith("- run:")) {
      const rest = trimmed.replace("- run:", "");
      content = (
        <>
          <span className="text-neutral-500">- </span>
          <span className="text-purple-400 font-medium">run</span>
          <span className="text-neutral-400">:</span>
          <span className="text-emerald-300">{rest}</span>
        </>
      );
    } else if (trimmed.startsWith("- ")) {
      const rest = trimmed.slice(2);
      content = (
        <>
          <span className="text-neutral-500">- </span>
          <span className="text-neutral-200">{rest}</span>
        </>
      );
    } else if (trimmed.includes(":")) {
      const colonIdx = trimmed.indexOf(":");
      const key = trimmed.slice(0, colonIdx);
      const value = trimmed.slice(colonIdx + 1);

      let formattedValue: React.ReactNode = value;
      if (value.trim()) {
        const valTrimmed = value.trim();
        const hasComma = valTrimmed.endsWith(",");
        const rawVal = hasComma ? valTrimmed.slice(0, -1).trim() : valTrimmed;

        if (
          (rawVal.startsWith("'") && rawVal.endsWith("'")) ||
          (rawVal.startsWith('"') && rawVal.endsWith('"'))
        ) {
          formattedValue = (
            <>
              {" "}
              <span className="text-emerald-300 font-normal">{rawVal}</span>
              {hasComma && <span className="text-neutral-400">,</span>}
            </>
          );
        } else if (rawVal.startsWith("[") && rawVal.endsWith("]")) {
          formattedValue = (
            <>
              {" "}
              <span className="text-neutral-400">[</span>
              <span className="text-amber-300 font-normal">
                {rawVal.slice(1, -1)}
              </span>
              <span className="text-neutral-400">]</span>
              {hasComma && <span className="text-neutral-400">,</span>}
            </>
          );
        } else if (rawVal === "{" || rawVal === "[") {
          formattedValue = (
            <>
              {" "}
              <span className="text-yellow-400 font-semibold">{rawVal}</span>
            </>
          );
        } else if (
          !isNaN(Number(rawVal)) ||
          ["true", "false", "null", "20.x", "3.12", "1.22", "ubuntu-latest", "stable"].includes(
            rawVal
          )
        ) {
          formattedValue = (
            <>
              {" "}
              <span className="text-amber-300 font-normal">{rawVal}</span>
              {hasComma && <span className="text-neutral-400">,</span>}
            </>
          );
        } else {
          formattedValue = (
            <>
              {" "}
              <span className="text-neutral-200">{rawVal}</span>
              {hasComma && <span className="text-neutral-400">,</span>}
            </>
          );
        }
      }

      content = (
        <>
          <span className="text-sky-300 font-medium">{key}</span>
          <span className="text-neutral-400">:</span>
          {formattedValue}
        </>
      );
    }

    return (
      <div key={index} className="table-row leading-6 hover:bg-white/[0.03] transition-colors">
        <span className="table-cell text-right pr-4 pl-2 select-none text-[12px] font-mono text-neutral-600 w-10">
          {index + 1}
        </span>
        <span className="table-cell font-mono text-[13px] text-neutral-200 whitespace-pre">
          {indent}
          {content}
        </span>
      </div>
    );
  };

  const lines = activeTab?.code.split("\n") || [];

  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-800 bg-[#0d1117] text-neutral-200 font-mono shadow-2xl overflow-hidden flex flex-col",
        className
      )}
    >
      {/* 1. VS CODE TOP WINDOW TITLE BAR */}
      <div className="h-9 bg-[#161b22] border-b border-neutral-800/80 px-3.5 flex items-center justify-between select-none text-xs text-neutral-400">
        {/* Left: Window Traffic Light Dots */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50 cursor-pointer shadow-xs" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50 cursor-pointer shadow-xs" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50 cursor-pointer shadow-xs" />
        </div>

        {/* Center: Window Title / Breadcrumbs */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono truncate max-w-sm">
          <span className="text-neutral-500">forjex</span>
          {breadcrumbParts.map((part, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3 h-3 text-neutral-600 shrink-0" />
              <span
                className={
                  idx === breadcrumbParts.length - 1
                    ? "text-white font-medium"
                    : "text-neutral-400"
                }
              >
                {part}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Right: Window Controls / Actions */}
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleCopy}
                  aria-label="Copy code"
                  className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
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
              <TooltipContent side="top">
                {copied ? "Copied" : "Copy"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <button
            type="button"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors"
            title="Split Editor"
          >
            <Split className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors"
            title="More Actions"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. VS CODE EDITOR TABS BAR */}
      <div className="flex items-center bg-[#090d12] border-b border-neutral-800 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTabId(tab.id);
                setCopied(false);
              }}
              className={cn(
                "group flex items-center gap-2 px-3.5 py-2 text-xs font-mono border-r border-neutral-800 transition-all cursor-pointer select-none shrink-0 relative",
                isActive
                  ? "bg-[#0d1117] text-white font-medium border-t-2 border-t-indigo-400 dark:border-t-white"
                  : "bg-[#090d12] text-neutral-400 hover:text-neutral-200 hover:bg-[#0d1117]/50 border-t-2 border-t-transparent"
              )}
            >
              <FileCode
                className={cn(
                  "w-3.5 h-3.5 shrink-0",
                  isActive
                    ? "text-indigo-400 dark:text-white"
                    : "text-neutral-500"
                )}
              />
              <span>{tab.tabLabel}</span>

              {tabs.length > 1 && (
                <span className="w-3.5 h-3.5 rounded flex items-center justify-center text-neutral-500 group-hover:text-neutral-300 hover:bg-neutral-800/80 transition-colors ml-1">
                  <X className="w-2.5 h-2.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. BREADCRUMBS ROW */}
      <div className="h-6 bg-[#0d1117] border-b border-neutral-800/60 px-4 flex items-center gap-1.5 text-[11px] text-neutral-500 font-mono select-none">
        {breadcrumbParts.map((part, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <ChevronRight className="w-3 h-3 text-neutral-600 shrink-0" />
            )}
            <span
              className={
                idx === breadcrumbParts.length - 1
                  ? "text-neutral-300 font-medium"
                  : "text-neutral-400"
              }
            >
              {part}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* 4. CODE EDITOR CANVAS WITH LINE NUMBERS */}
      <div className="py-3 px-2 overflow-x-auto bg-[#0d1117] flex-1">
        <div className="table w-full border-collapse">
          {lines.map((line, idx) => renderLine(line, idx))}
        </div>
      </div>

      {/* 5. VS CODE STATUS BAR */}
      <div className="h-6 bg-[#161b22] border-t border-neutral-800 px-3 flex items-center justify-between text-[11px] font-mono text-neutral-400 select-none">
        {/* Left Status Bar Items */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white hover:text-neutral-300 cursor-pointer">
            <GitBranch className="w-3 h-3 text-white" />
            <span>main*</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-neutral-400">
            <span>0 ⊗</span>
            <span>0 ⚠</span>
          </div>
        </div>

        {/* Right Status Bar Items */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">Ln {lines.length}, Col 1</span>
          <span className="hidden sm:inline">Spaces: 2</span>
          <span>UTF-8</span>
          <span className="text-white font-medium uppercase">
            {activeTab.language || "JSON"}
          </span>
          <div className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span className="hidden md:inline">Prettier</span>
          </div>
        </div>
      </div>
    </div>
  );
}
