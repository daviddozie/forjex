import { getTemplateFiles } from './content';

export function getTemplateStructure(framework: string): string {
  interface Entry {
    children: Map<string, Entry>;
  }
  const root: Entry = { children: new Map() };
  const paths = [
    ...getTemplateFiles(framework, 'my-app').map((file) => file.path),
    '.gitignore',
    'README.md',
  ];
  for (const path of paths) {
    let entry = root;
    for (const part of path.split('/')) {
      if (!entry.children.has(part)) entry.children.set(part, { children: new Map() });
      entry = entry.children.get(part)!;
    }
  }
  const lines: string[] = [];
  function walk(parent: Entry, prefix: string) {
    const children = [...parent.children].sort(([a, av], [b, bv]) => {
      const directoryOrder = Number(bv.children.size > 0) - Number(av.children.size > 0);
      return directoryOrder || a.localeCompare(b, 'en');
    });
    children.forEach(([name, entry], index) => {
      const last = index === children.length - 1;
      lines.push(prefix + (last ? '└── ' : '├── ') + name + (entry.children.size ? '/' : ''));
      walk(entry, prefix + (last ? '    ' : '│   '));
    });
  }
  walk(root, '');
  return lines.join('\n');
}
