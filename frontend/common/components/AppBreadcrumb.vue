<script setup lang="ts">
interface BreadcrumbItem {
  label: string
  icon?: string
}
const props = defineProps<{
  items: BreadcrumbItem[]
  sepratorIcon?: string
}>()

defineSlots<{
  separator: () => void
}>()
const slots = useSlots()
const hasSlot = (name: string) => !!slots[name]

const items = computed<BreadcrumbItem[]>(() => {
  return props.items
})
</script>
<template>
  <div class="flex items-center gap-2 font-bold text-muted-600">
    <template v-for="(item, index) in items">
      <span class="font-semibold"
        ><Icon :name="item.icon" class="text-white" /> {{ item.label }}</span
      >
      <template v-if="index != items.length - 1">
        <slot v-if="hasSlot('separator')" name="separator" />
        <Icon v-else :name="props.sepratorIcon" class="text-white" />
      </template>
    </template>
  </div>
</template>
