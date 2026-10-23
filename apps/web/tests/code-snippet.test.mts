import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const { CodeSnippet } = await import('../src/components/ui/code-snippet');

test('syntax highlighting renders code as escaped text rather than executable HTML', () => {
  const html = renderToStaticMarkup(
    createElement(CodeSnippet, {
      code: 'const message = "<script>alert(1)</script>";\n',
      language: 'typescript',
      filename: 'example.ts',
    }),
  );
  assert.match(html, /text-violet-300/);
  assert.match(html, /text-emerald-300/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /aria-label="Copy code"/);
});

test('file trees distinguish directories and files while preserving indentation', () => {
  const html = renderToStaticMarkup(
    createElement(CodeSnippet, {
      code: 'src/\n  app/\n    page.tsx',
      language: 'tree',
      filename: 'Project structure',
    }),
  );
  assert.match(html, /text-sky-300 font-medium/);
  assert.match(html, /text-emerald-200/);
  assert.match(html, /\n {4}/);
  assert.doesNotMatch(html, />TEXT</);
});
