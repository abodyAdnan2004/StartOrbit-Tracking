import eslintPluginPrettier from 'eslint-plugin-prettier'
import tailwindcss from 'eslint-plugin-tailwindcss'
import globals from 'globals'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // ─── Main config for JS / TS / Vue ─────────────────────────────────────────
  {
    files: ['**/*.{js,ts,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      prettier: eslintPluginPrettier,
      tailwindcss,
    },
    rules: {
      // ── Vue ──────────────────────────────────────────────────────────────
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      'vue/no-unused-vars': 'warn',
      'vue/no-unused-components': 'warn',
      'vue/component-api-style': ['warn', ['script-setup', 'composition']],
      'vue/define-macros-order': [
        'warn',
        { order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots'] },
      ],
      'vue/no-v-html': 'warn',
      'vue/padding-line-between-blocks': 'warn',
      'vue/prefer-import-from-vue': 'warn',

      // ── TypeScript ────────────────────────────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-empty-object-type': 'warn',

      // ── General JS ───────────────────────────────────────────────────────
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-var': 'error',
      'prefer-const': 'warn',
      'object-shorthand': 'warn',
      'no-duplicate-imports': 'error',

      // ── Tailwind CSS ─────────────────────────────────────────────────────
      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/no-custom-classname': 'off',
      'tailwindcss/no-contradicting-classname': 'error',

      // ── Prettier ─────────────────────────────────────────────────────────
      'prettier/prettier': 'warn',
    },
  },

  // ─── Vue-specific overrides ─────────────────────────────────────────────────
  {
    files: ['**/*.vue'],
    rules: {
      'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],
    },
  },

  // ─── Ignored paths ──────────────────────────────────────────────────────────
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/coverage/**',
      '**/build/**',
      '**/public/**',
    ],
  }
)
