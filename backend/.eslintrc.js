module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      project: './tsconfig.json',
      tsconfigRootDir: '.',
    },
    plugins: ['@typescript-eslint'],
    extends: [
      'eslint:recommended',
      '@typescript-eslint/recommended',
    ],
    root: true,
    env: {
      node: true,
      es6: true,
      es2020: true,
    },
    ignorePatterns: [
      'dist/**',
      'node_modules/**',
      '*.js',
      '.eslintrc.js',
      'prisma/**',
    ],
    overrides: [
      {
        files: ['*.ts'],
        parser: '@typescript-eslint/parser',
        parserOptions: {
          ecmaVersion: 2020,
          sourceType: 'module',
          project: './tsconfig.json',
        },
      },
    ],
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // General rules
      'no-console': 'off', // Allow console.log in backend
      'prefer-const': 'error',
      'no-var': 'error',
      
      // Import/export rules
      'no-duplicate-imports': 'error',
    },
  };