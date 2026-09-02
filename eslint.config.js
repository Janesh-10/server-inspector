import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    // Explicit global ignores for custom build directories
    ignores: ['ui/dist/', 'dist/', 'coverage/'],
  },
  {
    // Apply recommended JS rules globally or scope it explicitly
    ...js.configs.recommended,
  },
  {
    files: ['server/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-console': 'off',
      'no-undef': 'error',
    },
  },
];
