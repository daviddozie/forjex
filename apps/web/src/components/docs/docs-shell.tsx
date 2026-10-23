'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  ChevronRight,
  ChevronsUpDown,
  ExternalLink,
  Menu,
  Search,
  Tag,
  X,
} from 'lucide-react';
import { DOC_PAGES, LEGACY_DOC_LINKS, docHref, type DocLink } from '@/lib/docs/navigation';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { GithubIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

export interface DocHeading {
  id: string;
  title: string;
}

export function DocsShell({
  page,
  headings,
  version,
  children,
}: {
  page: DocLink;
  headings: DocHeading[];
  version: string;
  children: ReactNode;
}) {
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeHeading, setActiveHeading] = useState(headings[0]?.id || '');
  const desktopSearch = useRef<HTMLInputElement>(null);
  const mobileSearch = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const index = DOC_PAGES.findIndex((item) => item.slug === page.slug);
  const previous = DOC_PAGES[index - 1];
  const next = DOC_PAGES[index + 1];
  const normalized = query.trim().toLowerCase();
  const matches = DOC_PAGES.filter((item) =>
    `${item.title} ${item.description} ${item.group} ${item.keywords || ''}`
      .toLowerCase()
      .includes(normalized),
  );
  const groups = [...new Set(matches.map((item) => item.group))];

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (window.matchMedia('(min-width: 1024px)').matches) desktopSearch.current?.focus();
        else setMobileOpen(true);
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  useEffect(() => {
    if (page.slug) return;
    const followLegacyHash = () => {
      const hash = window.location.hash.slice(1);
      if (LEGACY_DOC_LINKS[hash]) router.replace(LEGACY_DOC_LINKS[hash]);
    };
    followLegacyHash();
    window.addEventListener('hashchange', followLegacyHash);
    return () => window.removeEventListener('hashchange', followLegacyHash);
  }, [page.slug, router]);

  useEffect(() => {
    const onScroll = () => {
      let current = headings[0]?.id || '';
      for (const heading of headings) {
        if ((document.getElementById(heading.id)?.getBoundingClientRect().top ?? Infinity) <= 150)
          current = heading.id;
      }
      setActiveHeading(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [headings]);

  const navigation = (mobile = false) => (
    <div className={cn('flex flex-col', !mobile && 'h-full min-h-0')}>
      <div className="mb-4 shrink-0 space-y-2">
        <Link
          href="/docs"
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-neutral-50/50 p-2.5 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:bg-neutral-900"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-blue-500/20 bg-blue-500/10 text-blue-500">
              <Boxes aria-hidden="true" className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-neutral-900 dark:text-white">
                CLI &amp; Cloud Mode
              </span>
              <span className="block truncate text-[10px] text-neutral-500">
                Unified Automation
              </span>
            </span>
          </span>
          <ChevronsUpDown aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
        </Link>
        <a
          href="https://github.com/daviddozie/forjex/releases"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-neutral-50/50 p-2.5 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:bg-neutral-900"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
              <Tag aria-hidden="true" className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-neutral-900 dark:text-white">
                Latest Version
              </span>
              <span className="block truncate font-mono text-[10px] text-neutral-500">
                v{version} (Production)
              </span>
            </span>
          </span>
          <ChevronsUpDown aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
        </a>
      </div>
      <div className="relative mb-7 shrink-0">
        <Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
        <input
          ref={mobile ? mobileSearch : desktopSearch}
          aria-keyshortcuts="Meta+K Control+K"
          aria-label={mobile ? 'Search documentation on mobile' : 'Search documentation'}
          placeholder="Find a guide…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-12 text-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/60"
        />
        {!query && (
          <kbd
            aria-hidden="true"
            className="pointer-events-none absolute right-2 top-2.5 rounded border border-neutral-200 bg-neutral-100 px-1 py-0.5 font-mono text-[10px] leading-4 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
          >
            ⌘K
          </kbd>
        )}
        {query && (
          <button
            aria-label="Clear documentation search"
            onClick={() => setQuery('')}
            className="absolute right-2 top-2.5 p-0.5 text-neutral-500"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <nav
        aria-label={mobile ? 'Documentation navigation on mobile' : 'Documentation navigation'}
        className={cn('space-y-7', !mobile && 'min-h-0 flex-1 overflow-y-auto')}
      >
        {groups.map((group) => (
          <div key={group}>
            <p className="mb-2 px-3 text-xs font-medium text-neutral-500">{group}</p>
            <ul className="space-y-0.5">
              {matches
                .filter((item) => item.group === group)
                .map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={docHref(item.slug)}
                      aria-current={page.slug === item.slug ? 'page' : undefined}
                      onClick={() => {
                        setMobileOpen(false);
                        setQuery('');
                      }}
                      className={cn(
                        'block rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400',
                        page.slug === item.slug
                          ? 'bg-neutral-100 font-medium text-neutral-950 dark:bg-neutral-900 dark:text-white'
                          : 'text-neutral-600 hover:bg-neutral-50 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-900/60 dark:hover:text-white',
                      )}
                    >
                      {item.title}
                      {normalized && (
                        <span className="mt-1 block text-xs font-normal leading-relaxed text-neutral-500">
                          {item.description}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
        {matches.length === 0 && (
          <p role="status" className="px-3 text-sm leading-relaxed text-neutral-500">
            No guides found. Try “React”, “install”, or “GitHub”.
          </p>
        )}
      </nav>
      <div className="mt-6 shrink-0 space-y-2 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-xs text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:hover:text-white"
        >
          <span>Projects Dashboard</span>
          <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
        </Link>
        <a
          href="https://github.com/daviddozie/forjex"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-xs text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:hover:text-white"
        >
          <span className="flex items-center gap-2">
            <GithubIcon aria-hidden="true" className="h-3.5 w-3.5" />
            GitHub Repository
          </span>
          <ExternalLink aria-hidden="true" className="h-3 w-3 shrink-0" />
        </a>
      </div>
    </div>
  );
  const toc = (
    <nav aria-label="On this page">
      <ul className="space-y-3">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={activeHeading === heading.id ? 'location' : undefined}
              className={cn(
                'block border-l pl-3 text-sm leading-5 transition-colors hover:text-black dark:hover:text-white',
                activeHeading === heading.id
                  ? 'border-neutral-900 font-medium text-neutral-900 dark:border-white dark:text-white'
                  : 'border-transparent text-neutral-500',
              )}
            >
              {heading.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <div className="w-full flex-1">
      <a
        href="#docs-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-16 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3 focus:text-black"
      >
        Skip to documentation
      </a>
      <div className="sticky top-14 z-30 flex items-center justify-between border-b border-neutral-200 bg-white/95 px-5 py-3 backdrop-blur lg:hidden dark:border-neutral-800 dark:bg-black/95">
        <button onClick={() => setMobileOpen(true)} className="flex items-center gap-2 text-sm">
          <Menu className="h-4 w-4" />
          Browse docs
        </button>
        <span className="text-xs text-neutral-500">{page.title}</span>
      </div>
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            mobileSearch.current?.focus();
          }}
          className="max-h-[85svh] overflow-y-auto"
        >
          <DialogTitle>Documentation</DialogTitle>
          <DialogDescription>Find a guide or choose a framework.</DialogDescription>
          {navigation(true)}
        </DialogContent>
      </Dialog>
      <div className="mx-auto grid max-w-[1536px] grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_210px]">
        <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] overflow-hidden border-r border-neutral-200 px-5 py-6 lg:block dark:border-neutral-800/70">
          {navigation()}
        </aside>
        <main
          id="docs-content"
          tabIndex={-1}
          className="min-w-0 px-5 py-9 outline-none sm:px-10 lg:px-12 lg:py-12 xl:px-14"
        >
          <div className="mx-auto max-w-[760px]">
            <nav
              aria-label="Breadcrumb"
              className="mb-8 flex flex-wrap items-center gap-2 text-xs text-neutral-500"
            >
              <Link href="/docs" className="hover:text-neutral-900 dark:hover:text-white">
                Docs
              </Link>
              <ChevronRight aria-hidden="true" className="h-3 w-3" />
              {page.group === 'Framework guides' && (
                <>
                  <Link
                    href="/docs/installation"
                    className="hover:text-neutral-900 dark:hover:text-white"
                  >
                    Installation
                  </Link>
                  <ChevronRight aria-hidden="true" className="h-3 w-3" />
                </>
              )}
              <span aria-current="page" className="text-neutral-900 dark:text-neutral-200">
                {page.title}
              </span>
            </nav>
            <header className="mb-10">
              <p className="mb-3 text-xs font-medium text-neutral-500">{page.group}</p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{page.title}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-500 dark:text-neutral-400">
                {page.description}
              </p>
            </header>
            <details className="mb-9 rounded-xl border border-neutral-200 p-4 xl:hidden dark:border-neutral-800">
              <summary className="cursor-pointer text-sm font-medium">On this page</summary>
              <div className="mt-4">{toc}</div>
            </details>
            <div className="space-y-12 text-sm leading-7 text-neutral-600 dark:text-neutral-400 [&_strong]:font-medium [&_strong]:text-neutral-900 dark:[&_strong]:text-neutral-100">
              {children}
            </div>
            <nav
              aria-label="Previous and next guide"
              className="mt-16 grid grid-cols-2 gap-4 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            >
              {previous ? (
                <Link
                  href={docHref(previous.slug)}
                  className="group min-w-0 rounded-xl border border-neutral-200 p-4 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/50"
                >
                  <span className="mb-2 flex items-center gap-2 text-xs text-neutral-500">
                    <ArrowLeft className="h-3 w-3" />
                    Previous
                  </span>
                  <span className="text-sm font-medium">{previous.title}</span>
                </Link>
              ) : (
                <div />
              )}
              {next && (
                <Link
                  href={docHref(next.slug)}
                  className="group min-w-0 rounded-xl border border-neutral-200 p-4 text-right hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/50"
                >
                  <span className="mb-2 flex items-center justify-end gap-2 text-xs text-neutral-500">
                    Next
                    <ArrowRight className="h-3 w-3" />
                  </span>
                  <span className="text-sm font-medium">{next.title}</span>
                </Link>
              )}
            </nav>
          </div>
        </main>
        <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] overflow-y-auto px-5 py-14 xl:block">
          <p className="mb-5 text-xs font-medium text-neutral-500">On this page</p>
          {toc}
          <div className="mt-9 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <p className="text-sm font-medium">Ready to start?</p>
            <p className="mt-2 text-xs leading-6 text-neutral-500">
              Choose a starter and make it yours.
            </p>
            <Link
              href="/docs/installation"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium"
            >
              Choose a framework
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
