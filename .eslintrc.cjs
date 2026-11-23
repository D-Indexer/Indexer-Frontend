// Module boundaries from docs/adr/0001-frontend-module-boundaries.md, enforced by eslint-plugin-boundaries.
const shared = ['config', 'constants', 'types', 'utils', 'validation']

module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'boundaries'],
  settings: {
    'import/resolver': {
      typescript: { project: './tsconfig.json' },
    },
    'boundaries/include': ['src/**/*', 'packages/*/src/**/*'],
    'boundaries/elements': [
      { type: 'entry', mode: 'file', pattern: ['src/main.tsx', 'src/App.tsx'] },
      { type: 'app', pattern: 'src/app' },
      { type: 'pages', pattern: 'src/pages' },
      { type: 'layouts', pattern: 'src/layouts' },
      { type: 'features', pattern: 'src/features/*', capture: ['feature'] },
      { type: 'components', pattern: 'src/components' },
      { type: 'hooks', pattern: 'src/hooks' },
      { type: 'services', pattern: 'src/services' },
      { type: 'store', pattern: 'src/store' },
      { type: 'data', pattern: 'src/data' },
      { type: 'testing', pattern: 'src/testing' },
      { type: 'config', pattern: 'src/config' },
      { type: 'constants', pattern: 'src/constants' },
      { type: 'types', pattern: 'src/types' },
      { type: 'utils', pattern: 'src/utils' },
      { type: 'validation', pattern: 'packages/validation' },
    ],
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          { from: 'entry', allow: ['entry', 'app', 'layouts', 'pages', 'components', ...shared] },
          { from: 'app', allow: ['app', 'pages', 'layouts', 'features', 'components', 'hooks', 'store', ...shared] },
          { from: 'pages', allow: ['pages', 'layouts', 'features', 'components', 'hooks', 'services', 'store', 'data', ...shared] },
          { from: 'layouts', allow: ['layouts', 'features', 'components', 'hooks', 'services', 'store', ...shared] },
          { from: 'features', allow: ['features', 'components', 'hooks', 'services', 'store', 'data', ...shared] },
          { from: 'hooks', allow: ['hooks', 'services', 'store', 'data', ...shared] },
          { from: 'components', allow: ['components', ...shared] },
          { from: 'services', allow: ['services', 'data', ...shared] },
          { from: 'store', allow: ['store', 'services', ...shared] },
          { from: 'data', allow: ['data', ...shared] },
          { from: 'testing', allow: ['testing', 'store', 'services', 'data', ...shared] },
          { from: 'config', allow: ['config'] },
          { from: 'constants', allow: ['constants', 'config', 'types'] },
          { from: 'types', allow: ['types'] },
          { from: 'utils', allow: ['utils', 'types'] },
          { from: 'validation', allow: ['validation'] },
        ],
      },
    ],
    // Services, pure helpers, config and the shared validation package must stay framework-free.
    'boundaries/external': [
      'error',
      {
        default: 'allow',
        rules: [
          { from: ['services', 'utils', 'config', 'data', 'types', 'constants', 'validation'], disallow: ['react', 'react-dom', 'react-router-dom'] },
        ],
      },
    ],
  },
  overrides: [
    {
      // Tests may reach across layers to build fixtures and mocks.
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: { 'boundaries/element-types': 'off', 'boundaries/external': 'off' },
    },
  ],
}
