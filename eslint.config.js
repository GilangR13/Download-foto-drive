import js from '@eslint/js';
export default [{ ignores: ['dist/**', 'node_modules/**'] }, js.configs.recommended, { rules: { 'no-undef': 'off', 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } }];
