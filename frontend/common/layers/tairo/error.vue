<script setup lang="ts">
const props = defineProps<{
  error: any
}>()
</script>

<template>
  <div class="min-h-screen bg-muted-100 pt-8 dark:bg-muted-900">
    <TairoError :error="props.error" />
  </div>
</template>
