import { notFound } from 'next/navigation';
import { DOC_PAGES } from '@/lib/docs/navigation';
import { DocSections, getDocSections } from '@/lib/docs/content';
import { DocsShell } from './docs-shell';
import packageInfo from '../../../../../package.json';

export function DocsDocument({ slug }: { slug: string }) {
  const page = DOC_PAGES.find((item) => item.slug === slug);
  if (!page) notFound();
  const sections = getDocSections(slug);
  return (
    <DocsShell
      page={page}
      version={packageInfo.version}
      headings={sections.map(({ id, title }) => ({ id, title }))}
    >
      <DocSections sections={sections} />
    </DocsShell>
  );
}
