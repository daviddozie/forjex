import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import next from '@next/eslint-plugin-next';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.next-dev/**',
      '**/dist/**',
      '**/coverage/**',
      '**/next-env.d.ts',
      'apps/web/drizzle/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,tsx}'],
    languageOptions: { globals: globals.node },
    plugins: { '@next/next': next },
    settings: { next: { rootDir: fileURLToPath(new URL('./apps/web/', import.meta.url)) } },
    rules: {
      'preserve-caught-error': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
    },
  },
);
