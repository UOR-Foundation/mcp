// eslint.config.js
import parser from '@typescript-eslint/parser';
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      'no-unused-vars': 'warn',
    },
    ignores: [
      'dist/**',
      'node_modules/**',
      'public/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.test.js',
      'src/tests/**',
      'jest.config.js',
      'vite.config.ts'
    ]
  }
];
