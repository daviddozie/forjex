'use client';

import { CodeSnippet } from './code-snippet';
export interface VSCodeTab {
  id: string;
  filename: string;
  tabLabel: string;
  path?: string;
  language?: string;
  code: string;
}
export function VSCodeBlock({
  tabs,
  defaultTabId,
  className,
}: {
  tabs: VSCodeTab[];
  defaultTabId?: string;
  className?: string;
}) {
  return (
    <CodeSnippet
      tabs={tabs.map((tab) => ({
        id: tab.id,
        label: tab.tabLabel,
        code: tab.code,
        language: tab.language,
      }))}
      defaultTabId={defaultTabId}
      filename="Configuration"
      className={className}
    />
  );
}
