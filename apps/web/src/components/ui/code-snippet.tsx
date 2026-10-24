'use client';

import * as React from 'react';
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import { Check, Copy, FileCode2, FolderTree } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SnippetTab {
  id: string;
  label: string;
  code: string;
  language?: string;
}

export interface CodeSnippetProps {
  code?: string;
  language?: string;
  filename?: string;
  className?: string;
  tabs?: SnippetTab[];
  activeTabId?: string;
  defaultTabId?: string;
  onTabChange?: (id: string) => void;
  showLineNumbers?: boolean;
}

const colors: Record<string, string> = {
  comment: 'text-zinc-500 italic',
  prolog: 'text-zinc-500',
  punctuation: 'text-zinc-400',
  keyword: 'text-violet-300',
  boolean: 'text-violet-300',
  operator: 'text-zinc-400',
  string: 'text-emerald-300',
  char: 'text-emerald-300',
  'attr-value': 'text-emerald-300',
  function: 'text-sky-300',
  'function-variable': 'text-sky-300',
  'class-name': 'text-amber-200',
  number: 'text-orange-300',
  constant: 'text-orange-300',
  property: 'text-sky-300',
  tag: 'text-rose-300',
  'attr-name': 'text-sky-300',
  regex: 'text-amber-200',
  variable: 'text-zinc-200',
  builtin: 'text-sky-300',
  symbol: 'text-rose-300',
  command: 'text-sky-300',
  directory: 'text-sky-300 font-medium',
  file: 'text-emerald-200',
  parameter: 'text-amber-200',
};

const shellGrammar = Prism.languages.extend('bash', {
  command: {
    pattern:
      /((?:^|[\n;&|])\s*)(?:npm|npx|pnpm|yarn|bun|bunx|forjex|node|python|uvicorn|cargo|go|git|cd|source)\b/m,
    lookbehind: true,
  },
});

const treeGrammar: Prism.Grammar = {
  comment: /#.*$/m,
  directory: /[\w@()[\].-]+\//,
  file: /(?:\.?[\w-]+\.)+[\w-]+/,
  punctuation: /[│├└─]/,
};

function tokensToReact(tokens: (string | Prism.Token)[]): ReactNode {
  return tokens.map((token, index) => {
    if (typeof token === 'string') return token;
    const content =
      typeof token.content === 'string'
        ? token.content
        : tokensToReact(Array.isArray(token.content) ? token.content : [token.content]);
    return (
      <span key={index} className={colors[token.type] || 'text-zinc-200'}>
        {content}
      </span>
    );
  });
}

function TerminalBadge() {
  return (
    <div
      aria-hidden="true"
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-zinc-700/60 bg-zinc-800/80 font-mono text-[10px] font-bold text-zinc-300 select-none shadow-xs"
    >
      &gt;_
    </div>
  );
}

function FileBadge({ filename, language }: { filename?: string; language?: string }) {
  const lower = (filename || '').toLowerCase();
  if (
    lower.endsWith('.tsx') ||
    lower.endsWith('.ts') ||
    language === 'typescript' ||
    language === 'tsx'
  ) {
    return (
      <span
        aria-hidden="true"
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#3178c6]/20 font-mono text-[9px] font-bold text-[#3178c6] border border-[#3178c6]/30 select-none"
      >
        TS
      </span>
    );
  }
  if (
    lower.endsWith('.jsx') ||
    lower.endsWith('.js') ||
    language === 'javascript' ||
    language === 'jsx'
  ) {
    return (
      <span
        aria-hidden="true"
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#f7df1e]/20 font-mono text-[9px] font-bold text-[#f7df1e] border border-[#f7df1e]/30 select-none"
      >
        JS
      </span>
    );
  }
  if (lower.endsWith('.json') || language === 'json') {
    return (
      <span
        aria-hidden="true"
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-amber-500/20 font-mono text-[9px] font-bold text-amber-400 border border-amber-500/30 select-none"
      >
        {'{}'}
      </span>
    );
  }
  if (language === 'tree') {
    return <FolderTree aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-zinc-400" />;
  }
  return <FileCode2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-zinc-400" />;
}

export function CodeSnippet({
  code = '',
  language = 'bash',
  filename,
  className,
  tabs = [],
  activeTabId,
  defaultTabId,
  onTabChange,
  showLineNumbers,
}: CodeSnippetProps) {
  const [selected, setSelected] = useState(defaultTabId || tabs[0]?.id || '');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  const active = tabs.find((tab) => tab.id === (activeTabId ?? selected)) || tabs[0];
  const source = active?.code ?? code;
  const lang = active?.language || language;
  const aliases: Record<string, string> = {
    sh: 'bash',
    shell: 'bash',
    terminal: 'bash',
    js: 'javascript',
    ts: 'typescript',
    yml: 'yaml',
    html: 'markup',
    svg: 'markup',
    py: 'python',
  };
  const resolved = aliases[lang.toLowerCase()] || lang.toLowerCase();

  const highlighted = useMemo(() => {
    const grammar =
      resolved === 'tree'
        ? treeGrammar
        : resolved === 'bash'
          ? shellGrammar
          : Prism.languages[resolved];
    return grammar ? tokensToReact(Prism.tokenize(source, grammar)) : source;
  }, [source, resolved]);

  useEffect(() => {
    setCopyState('idle');
  }, [source]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const select = (tabId: string) => {
    setSelected(tabId);
    onTabChange?.(tabId);
  };

  const copy = async () => {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(source);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
    timer.current = setTimeout(() => setCopyState('idle'), 2500);
  };

  const isPackageManagerTabs =
    tabs.length > 0 && tabs.some((tab) => ['pnpm', 'npm', 'yarn', 'bun'].includes(tab.id));

  const isMultiLine = source.includes('\n');
  const shouldShowLineNumbers =
    showLineNumbers ??
    (resolved !== 'tree' &&
      resolved !== 'bash' &&
      resolved !== 'sh' &&
      resolved !== 'shell' &&
      resolved !== 'text' &&
      !isPackageManagerTabs &&
      Boolean(filename && /\.(tsx?|jsx?|vue|py|go|rs|css|html|json)$/i.test(filename)) &&
      isMultiLine);

  const lineNumberedContent = useMemo(() => {
    if (!shouldShowLineNumbers) return null;
    const grammar =
      resolved === 'tree'
        ? treeGrammar
        : resolved === 'bash'
          ? shellGrammar
          : Prism.languages[resolved];
    const lines = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    if (lines.length > 1 && lines[lines.length - 1] === '') {
      lines.pop();
    }
    return lines.map((lineText, idx) => {
      const lineTokens = grammar && lineText ? Prism.tokenize(lineText, grammar) : [lineText];
      const content = lineText ? tokensToReact(lineTokens) : '\u00A0';
      return (
        <div key={idx} className="flex px-4 hover:bg-white/[0.02]">
          <span className="w-8 shrink-0 select-none pr-4 text-right font-mono text-xs text-zinc-600">
            {idx + 1}
          </span>
          <span className="min-w-0 whitespace-pre">{content}</span>
        </div>
      );
    });
  }, [shouldShowLineNumbers, source, resolved]);

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    let target: number;
    if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') target = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = tabs.length - 1;
    else return;
    event.preventDefault();
    select(tabs[target].id);
    document.getElementById(`${id}-${tabs[target].id}`)?.focus();
  };

  return (
    <div
      className={cn(
        'group relative min-w-0 overflow-hidden rounded-xl border border-zinc-800/80 bg-[#09090b] text-zinc-200 shadow-xs transition-colors dark:border-zinc-800/80 dark:bg-[#09090b]',
        className,
      )}
    >
      <div className="flex h-10 items-center justify-between border-b border-zinc-800/50 bg-zinc-900/30 px-3.5">
        <div className="flex min-w-0 items-center gap-2">
          {tabs.length > 0 ? (
            isPackageManagerTabs ? (
              <div className="flex items-center gap-2">
                <TerminalBadge />
                <div
                  role="tablist"
                  aria-label={filename ? `${filename} variants` : 'Package manager commands'}
                  className="flex items-center gap-1"
                >
                  {tabs.map((tab, index) => {
                    const isSelected = active?.id === tab.id;
                    return (
                      <button
                        key={tab.id}
                        id={`${id}-${tab.id}`}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        aria-controls={`${id}-panel`}
                        tabIndex={isSelected ? 0 : -1}
                        onClick={() => select(tab.id)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className={cn(
                          'cursor-pointer rounded-md px-2.5 py-1 font-mono text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400',
                          isSelected
                            ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                            : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200',
                        )}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div
                role="tablist"
                aria-label={filename ? `${filename} variants` : 'Code files'}
                className="flex items-center gap-1 overflow-x-auto"
              >
                {tabs.map((tab, index) => {
                  const isSelected = active?.id === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`${id}-${tab.id}`}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      aria-controls={`${id}-panel`}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => select(tab.id)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className={cn(
                        'flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400',
                        isSelected
                          ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                          : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200',
                      )}
                    >
                      <FileBadge filename={tab.label} language={tab.language} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )
          ) : resolved === 'bash' || filename === 'Terminal' ? (
            <div className="flex items-center gap-2">
              <TerminalBadge />
              {filename && filename !== 'Terminal' && (
                <span className="truncate font-mono text-xs text-zinc-400">{filename}</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FileBadge filename={filename} language={resolved} />
              <span className="truncate font-mono text-xs font-medium text-zinc-300">
                {filename || (resolved === 'tree' ? 'Project structure' : 'Code')}
              </span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={copy}
            aria-label={copyState === 'copied' ? 'Code copied' : 'Copy code'}
            title={copyState === 'copied' ? 'Copied' : 'Copy code'}
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
          >
            {copyState === 'copied' ? (
              <Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy aria-hidden="true" className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      <div
        id={`${id}-panel`}
        role={tabs.length ? 'tabpanel' : undefined}
        aria-labelledby={tabs.length ? `${id}-${active?.id}` : undefined}
      >
        {shouldShowLineNumbers ? (
          <div className="max-h-[36rem] overflow-auto py-3 text-[13px] leading-6 font-mono text-zinc-200">
            <div className="min-w-fit">{lineNumberedContent}</div>
          </div>
        ) : (
          <pre
            tabIndex={0}
            aria-label={filename || 'Code snippet'}
            className="max-h-[36rem] overflow-auto p-4 text-[13px] leading-relaxed outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-zinc-400"
          >
            <code data-language={resolved} className="font-mono whitespace-pre text-zinc-200">
              {highlighted}
            </code>
          </pre>
        )}
      </div>

      <span
        role="status"
        aria-live="polite"
        className={
          copyState === 'error'
            ? 'block border-t border-zinc-800/60 px-4 py-2 text-xs text-amber-200'
            : 'sr-only'
        }
      >
        {copyState === 'copied'
          ? 'Code copied to clipboard.'
          : copyState === 'error'
            ? 'Could not copy. Select the code and copy it manually.'
            : ''}
      </span>
    </div>
  );
}
