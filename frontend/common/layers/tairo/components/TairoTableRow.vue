<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    hoverable?: boolean
  }>(),
  {
    hoverable: true,
  }
)
</script>

<template>
  <tr
    :class="[
      props.hoverable
        ? 'transition-colors duration-300 hover:bg-muted-50 dark:hover:bg-muted-900'
        : '',
    ]"
  >
    <slot />
  </tr>
</template>
