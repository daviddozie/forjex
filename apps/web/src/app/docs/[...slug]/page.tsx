import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsDocument } from '@/components/docs/docs-document';
import { DOC_PAGES } from '@/lib/docs/navigation';

type Props = { params: Promise<{ slug: string[] }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return DOC_PAGES.filter((page) => page.slug).map((page) => ({ slug: page.slug.split('/') }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = DOC_PAGES.find((item) => item.slug === slug.join('/'));
  if (!page) notFound();
  return { title: `${page.title} — Forjex Docs`, description: page.description };
}

export default async function DocumentationPage({ params }: Props) {
  const { slug } = await params;
  return <DocsDocument slug={slug.join('/')} />;
}
