import type { Metadata } from 'next';
import { DocsDocument } from '@/components/docs/docs-document';

export const metadata: Metadata = {
  title: 'Introduction — Forjex Docs',
  description:
    'Start a new application, connect an existing project, or use the browser wizard. Find the right Forjex guide.',
};

export default function DocsPage() {
  return <DocsDocument slug="" />;
}
