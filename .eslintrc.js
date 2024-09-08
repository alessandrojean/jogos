module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    warnOnUnsupportedTypeScriptVersion: false,
  },
  rules: {
    '@typescript-eslint/restrict-template-expressions': ['error', { allowNullish: true, },],
    '@typescript-eslint/no-non-null-assertion': ['disable']
  },
  plugins: ['@typescript-eslint'],
  root: true,
};
