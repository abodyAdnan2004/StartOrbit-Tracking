<script lang="ts" setup>
interface Props {
  icon?: string
  label?: string
  value?: any
}
defineProps<Props>()
const slots = useSlots()
const hasSlot = (name: string) => !!slots[name]
defineSlots<{
  default: () => void
}>()
</script>
<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-center gap-3">
      <Icon
        :name="icon ?? 'ph:info'"
        class="border-1 rounded-lg border-primary-500 bg-primary-500/5 text-primary-500"
      />
      <p class="text-muted text-sm font-bold">
        {{ label }}
      </p>
    </div>
    <p v-if="!hasSlot('default')">
      {{ value }}
    </p>
    <slot v-else />
  </div>
</template>
