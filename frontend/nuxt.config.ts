import VueI18nVitePlugin from '@intlify/unplugin-vue-i18n/vite'
import { existsSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'url'
import viteSvgLoader from 'vite-svg-loader'
export default defineNuxtConfig({
  typescript: {
    shim: false,
  },
  ssr: false,
  srcDir: '.',

  extends: ['./common/layers/tairo-layout-collapse', './common/layers/tairo'],
  build: {
    transpile: ['@vuepic/vue-datepicker', 'vue-i18n'],
  },

  devtools: { enabled: true },
  pages: true,

  // Configure Nitro for static generation
  nitro: {
    preset: 'static',
    prerender: {
      crawlLinks: false,
      failOnError: false,
    },
    logLevel: 'error', // Suppress warnings
  },
  devServer: {
    port: 3029,
  },
  modules: ['@pinia/nuxt'],
  pinia: {
    storesDirs: ['./stores/**', './common/components/**/stores', './features/**/store'],
  },

  hooks: {
    'pages:extend'(pages) {
      const featuresDir = resolve(dirname(fileURLToPath(import.meta.url)), 'features')
      if (!existsSync(featuresDir)) return

      readdirSync(featuresDir).forEach((feature) => {
        const routesDir = resolve(featuresDir, feature, 'routes')
        if (!existsSync(routesDir)) return

        readdirSync(routesDir).forEach((file) => {
          if (!file.endsWith('.vue')) return
          const name = file.replace('.vue', '')
          const path = name === 'index' ? '/' : `/${name}`
          pages.push({ name, path, file: resolve(routesDir, file) })
        })
      })
    },
  },

  components: [
    {
      path: '~/common/components/global',
      pathPrefix: false,
      global: true,
    },
    {
      path: '~/common/components',
      pathPrefix: false,
      ignore: ['**/types/**', '**/global/**'],
    },
  ],

  dir: {
    layouts: 'common/layouts',
    plugins: 'common/plugins',
  },

  imports: {
    dirs: ['common/utils/**', 'common/services/**'],
  },

  css: ['~/assets/css/style.css'],
  vite: {
    optimizeDeps: {
      exclude: ['#app-manifest'],
      include: [
        '@headlessui/vue',
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@vuelidate/validators',
        'vue-flatpickr-component',
        '@vuelidate/core',
        'axios',
        'vue3-apexcharts',
      ],
    },
    server: {
      fs: {
        allow: ['.'],
      },
    },
    plugins: [
      viteSvgLoader(),
      VueI18nVitePlugin({
        include: [resolve(dirname(fileURLToPath(import.meta.url)), './common/locales/*.json')],
      }),
    ],
  },
  app: {
    head: {
      viewport: 'width=device-width,initial-scale=1',
      link: [
        { rel: 'icon', href: '/logo.png', sizes: 'any' },
        { rel: 'icon', type: 'image/svg+xml', href: '/logo.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
        {
          href: 'https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap',
          rel: 'stylesheet',
        },
      ],
    },
  },

  compatibilityDate: '2025-01-01',
})
