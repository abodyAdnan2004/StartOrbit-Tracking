<script setup lang="ts">
import { useI18n } from 'vue-i18n'
interface TairoConfig {
  title?: string
}

interface AppConfig {
  tairo?: TairoConfig
  // add other properties if needed
}

const app = useAppConfig() as AppConfig
const i18n = useI18n()
useHead({
  titleTemplate: (titleChunk) => {
    //

    return titleChunk ? `${titleChunk} - ${app.tairo?.title}` : `${app.tairo?.title}`
  },
  htmlAttrs: {
    lang: i18n.locale.value,
    dir: i18n.locale.value === 'ar' ? 'rtl' : 'ltr',
  },
  link: [
    {
      rel: 'icon',
      type: 'image/png',
      href: '/img/favicon.png',
    },
  ],
})

const colorMode = useColorMode()
colorMode.value = 'light'
colorMode.preference = 'light'
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtLoadingIndicator color="rgb(var(--color-primary-500))" />
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<style lang="scss">
@import url('common/styles/main.scss');

@font-face {
  font-family: 'BahijHelveticaNeue';
  src: url('~/assets/fonts/BahijHelveticaNeue-Roman.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'BahijHelveticaNeue';
  src: url('~/assets/fonts/BahijHelveticaNeue-Bold.ttf') format('truetype');
  font-weight: bold;
  font-style: normal;
}

@font-face {
  font-family: 'BahijHelveticaNeue';
  src: url('~/assets/fonts/BahijHelveticaNeue-Light.ttf') format('truetype');
  font-weight: lighter;
  font-style: normal;
}

body,
* {
  font-family: 'BahijHelveticaNeue', sans-serif !important;
}
</style>
