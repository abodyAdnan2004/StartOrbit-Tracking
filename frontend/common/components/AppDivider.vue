<script setup lang="ts">
const props = defineProps<{
  title?: string
  icon?: string
  class?: string
  alignment?: 'center' | 'right' | 'left'
  gap?: number
}>()
defineSlots<{
  default: () => void
}>()
const slots = useSlots()
</script>
<template>
  <div :class="props.class">
    <BaseHeading>
      <template v-if="!slots.default">
        <Icon v-if="props.icon" :name="props.icon" />{{ props.title }}
      </template>
      <slot v-else />
    </BaseHeading>
    <div :style="`margin-top: ${props.gap ?? 10}px;margin-bottom: ${props.gap ?? 10}px;`">
      <BaseDropdownDivider />
    </div>
  </div>
</template>
