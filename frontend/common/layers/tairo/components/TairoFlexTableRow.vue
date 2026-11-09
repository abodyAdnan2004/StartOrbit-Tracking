<script setup lang="ts">
const props = defineProps<{
  /**
   * The radius of the row.
   */
  rounded?: 'none' | 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <div
    class="flex flex-col border border-muted-200 bg-white dark:border-muted-700 dark:bg-muted-800 md:flex-row md:items-center md:justify-between"
    :class="[
      props.rounded === 'sm' && 'rounded-md',
      props.rounded === 'md' && 'rounded-lg',
      props.rounded === 'lg' && 'rounded-xl',
    ]"
  >
    <slot />
  </div>
</template>
