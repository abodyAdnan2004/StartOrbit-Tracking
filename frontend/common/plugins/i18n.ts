import { createI18n } from 'vue-i18n'
import ar from '~/common/locales/ar.json'
import en from '~/common/locales/en.json'

export default defineNuxtPlugin(({ vueApp }) => {
  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: localStorage.getItem('locale') || 'en',
    defaultLocale: 'en',
    messages: {
      ar,
      en,
    },
  })

  vueApp.use(i18n)
})
