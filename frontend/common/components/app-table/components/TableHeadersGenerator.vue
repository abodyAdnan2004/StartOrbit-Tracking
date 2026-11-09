<script lang="ts" setup>
import type { TableHeader } from '../types'

interface Props {
  headers: TableHeader[]
  hasSelect?: boolean
}
const allSlotsSelectedIndicator = defineModel()
const emit = defineEmits(['check'])
const props = defineProps<Props>()
const headers = computed(() => props.headers)
const slots = useSlots()
const hasSlot = (name: string) => !!slots[name]
</script>
<template>
  <tr>
    <th v-if="hasSelect" uppercase spaced class="text-center">
      <span :id="`header-select`" class="text-sm">
        <BaseCheckbox
          class="mx-2 !size-4"
          :checked="allSlotsSelectedIndicator"
          @change="() => emit('check')"
        />
      </span>
    </th>
    <th
      v-for="header in headers"
      :key="header.key"
      uppercase
      spaced
      :class="`${header.center ? 'text-center' : 'text-start'}`"
    >
      <span v-if="!hasSlot(`header-${header.key}`)" :id="`header-${header.key}`">
        {{ header.label }}
      </span>
      <slot v-else :name="`header-${header.key}`" />
    </th>
  </tr>
</template>
