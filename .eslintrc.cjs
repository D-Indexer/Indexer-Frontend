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
  plugins: ['@typescript-eslint'],
  rules: {
    'no-restricted-globals': [
      'error',
      {
        name: 'localStorage',
        message: 'Use the typed storage wrapper in src/services/storage instead.',
      },
      {
        name: 'sessionStorage',
        message: 'Use the typed storage wrapper in src/services/storage instead.',
      },
    ],
    'no-restricted-properties': [
      'error',
      {
        object: 'window',
        property: 'localStorage',
        message: 'Use the typed storage wrapper in src/services/storage instead.',
      },
      {
        object: 'window',
        property: 'sessionStorage',
        message: 'Use the typed storage wrapper in src/services/storage instead.',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
  },
  overrides: [
    {
      // The wrapper is the only place allowed to touch Web Storage directly.
      files: ['src/services/storage/**/*.ts'],
      rules: {
        'no-restricted-globals': 'off',
        'no-restricted-properties': 'off',
      },
    },
  ],
}
