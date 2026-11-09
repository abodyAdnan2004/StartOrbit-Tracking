<template>
  <!-- <BaseButton
      color="muted"
      @click="changeLocale"
      variant="pastel"
      class="flex items-center gap-2"
    >
      <Icon name="mdi-translate" size="20" ></Icon>
      {{$i18n.locale === 'en' ? 'English' : 'العربية'}}
    </BaseButton> -->
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const i18n = useI18n()

const changeLocale = () => {
  i18n.locale.value = i18n.locale.value === 'en' ? 'ar' : 'en'
  localStorage.setItem('locale', i18n.locale.value)
}
onMounted(() => {
  const locale = localStorage.getItem('locale')!
  if (locale !== i18n.locale.value && locale != null) {
    i18n.locale.value = locale
    // window.location.reload();
  }
})
</script>

<style></style>
