<script setup generic="T" lang="ts">
import type { TableHeader, GenerateSlots } from '../types'

interface Props {
  items: T[]
  headers: TableHeader[]
}
const props = defineProps<Props>()
const items = computed(() => props.items)
const headers = computed(() => props.headers)
const slots = useSlots()

const hasSlot = (name: string) => !!slots[name]

defineSlots<GenerateSlots<T>>()

const slotName = (slot: string): keyof GenerateSlots<T> => {
  return slot as keyof GenerateSlots<T>
}
</script>
<template>
  <tr>
    <td>test</td>
  </tr>
  <!-- <tr v-for="(item, index) in items" :key="`table-data-${index}`" class="bg-accent">
        <td v-for="(header, headerIndex) in headers" :key="`table-header-${headerIndex}`" spaced>
            <span v-if="!hasSlot(`data-${header.key}`)">
                {{ item[header.key as keyof typeof item] ? item[header.key as keyof typeof item] : 'لا يوجد' }}
            </span>
            <slot v-else :name="slotName(`data-${header.key}`)" :item="item" :index="index" />
        </td>
    </tr> -->
</template>
