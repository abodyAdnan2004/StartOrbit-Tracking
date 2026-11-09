<script lang="ts" setup>
defineProps<{
  isOpen: boolean
}>()

const version = import.meta.env.VITE_APP_VERSION
</script>

<template>
  <div v-if="isOpen" class="h-50 footer-bg flex w-full flex-col items-center justify-center pt-4">
    <p class="text-center text-gray-200">Version - {{ version }}</p>
  </div>
</template>
<style scoped>
/* .footer-bg {
  background-image: url('~/assets/images/footer-nav.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
} */
</style>
