<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    uppercase?: boolean
    spaced?: boolean
  }>(),
  {
    uppercase: false,
    spaced: false,
  }
)
</script>

<template>
  <th
    class="text-left font-sans font-semibold tracking-wider text-muted-700 dark:text-muted-400"
    :class="[
      props.uppercase ? 'text-xs uppercase' : 'text-sm',
      props.spaced
        ? 'last:border-e-none border-r border-muted-200 bg-white px-4 py-5 dark:border-muted-700 dark:bg-muted-800'
        : 'bg-muted-50 py-3 dark:bg-muted-800',
    ]"
  >
    <slot />
  </th>
</template>
