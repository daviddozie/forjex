'use client';

import { useEffect, useState } from 'react';
import { CodeSnippet } from './code-snippet';
export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';
const managers: PackageManager[] = ['pnpm', 'npm', 'yarn', 'bun'];
const defaults: Record<PackageManager, string> = {
  npm: 'npm install -g forjex\nforjex forge',
  pnpm: 'pnpm add -g forjex\nforjex forge',
  yarn: 'yarn global add forjex\nforjex forge',
  bun: 'bun add -g forjex\nforjex forge',
};
export function PackageManagerBlock({
  commands = defaults,
  defaultManager = 'pnpm',
  className,
}: {
  commands?: Record<PackageManager, string>;
  defaultManager?: PackageManager;
  className?: string;
}) {
  const [manager, setManager] = useState<PackageManager>(defaultManager);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('forjex_preferred_pm');
      if (managers.includes(saved as PackageManager)) setManager(saved as PackageManager);
    } catch {}
  }, []);
  return (
    <CodeSnippet
      className={className}
      activeTabId={manager}
      onTabChange={(id) => {
        setManager(id as PackageManager);
        try {
          localStorage.setItem('forjex_preferred_pm', id);
        } catch {}
      }}
      tabs={managers.map((id) => ({ id, label: id, language: 'bash', code: commands[id] }))}
    />
  );
}
