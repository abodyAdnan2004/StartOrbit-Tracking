<script lang="ts" setup generic="T">
import CardLoading from './components/CardLoading.vue'
import CardNoData from './components/CardNoData.vue'
import type { TableHeader, CardSlot } from './types'
import { useAppTableStore } from './stores/AppTableStore'
const appTableStore = useAppTableStore()
interface Props {
  headers: TableHeader[]
  items: T[]
  titleKey?: string
  cardsPerRow?: number
}

const props = defineProps<Props>()
const slots = useSlots()
appTableStore.setData(props.items)
const isLoading = computed(() => appTableStore.isLoading)
const hasSlot = (name: string) => !!slots[name]
defineSlots<{
  default: CardSlot<T>
  actions: CardSlot<T>
  footer: CardSlot<T>
  'custom-card': CardSlot<T>
}>()
</script>
<template>
  <div class="w-full">
    <div
      class="grid gap-6"
      :style="`grid-template-columns: repeat(${props.cardsPerRow ?? 4},1fr);`"
    >
      <CardLoading v-if="isLoading" :cards="8" :items="headers.length" />
      <template v-for="(item, index) in props.items" v-else>
        <slot v-if="hasSlot('custom-card')" name="custom-card" :item="item" :index="index" />
        <BaseCard v-else color="default" rounded="md" class="p-6">
          <BaseHeading
            as="h4"
            size="sm"
            weight="semibold"
            lead="tight"
            class="mb-2 flex items-center justify-between text-muted-800 dark:text-white"
          >
            <h3>
              {{ item[(props.titleKey ?? 'title') as keyof T] }}
            </h3>
            <slot name="actions" :item="item" :index="index" />
          </BaseHeading>
          <BaseDropdownDivider />
          <BaseParagraph class="overflow-hidden">
            <slot :item="item" :index="index" />
          </BaseParagraph>
          <BaseDropdownDivider v-if="hasSlot('footer')" class="my-3" />
          <slot name="footer" :item="item" :index="1" />
        </BaseCard>
      </template>
    </div>
    <CardNoData v-if="items.length == 0 && !isLoading" />
  </div>
</template>
