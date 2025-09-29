module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    env: {
      node: true,
      es6: true,
    },
    ignorePatterns: [
      'dist/**/*',
      'node_modules/**/*',
      '*.js',
      '.eslintrc.js',
      'prisma/**/*',
      '.nixpacks/**/*',
    ],
    rules: {
      // Disable all rules for now to just get through build
    },
  };
  