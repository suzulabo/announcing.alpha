module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    project: ['./tsconfig.lint.json', '*/**/tsconfig.json'],
  },
  settings: {
    react: {
      version: '17.0.1',
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@stencil/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    '@stencil/decorators-style': 'off',
    '@stencil/required-jsdoc': 'off',
    '@stencil/strict-boolean-conditions': 'off',
    '@typescript-eslint/no-floating-promises': 'error',

    'require-await': 'off',
    '@typescript-eslint/require-await': 'warn',
  },
};
