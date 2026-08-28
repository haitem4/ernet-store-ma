import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'client/dist/**',
      'server/uploads/**',
      'logs/**',
      'pg/**',
      'pg2/**',
      'pg3/**',
      '.redis/**',
      '*.txt',
      '*.png',
      '*.zip',
      'server/check-*.js',
      'server/test-*.js',
      'server/parse-*.js',
      'server/diagnose-*.js',
      'server/inspect-*.js',
      'server/_*-temp.js',
      'server/sync-disway.js',
    ],
  },
  js.configs.recommended,
  {
    files: ['server/**/*.js', '*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.node, document: 'readonly', fetch: 'readonly', location: 'readonly' },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['client/src/**/*.{js,jsx}', 'client/*.js'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'off',
      'no-unused-vars': 'off',
    },
  },
];
