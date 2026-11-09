<script setup generic="T" lang="ts">
import TableDataGenerator from './components/TableDataGenerator.vue'
import TableHeadersGenerator from './components/TableHeadersGenerator.vue'
import TableNoData from './components/TableNoData.vue'
import TableLoading from './components/TableLoading.vue'
import { get, orderBy } from 'lodash-es'
import type { TableHeader, GenerateSlots, SortOrder } from './types'

interface Props {
  headers: TableHeader[]
  items: T[]
  isLoading?: boolean
  hideNoData?: boolean
  rowKey?: string
  highlightedRows?: string[] | number[]
  hasSelect?: boolean
}
const props = defineProps<Props>()
const emits = defineEmits<{
  (e: 'row-clicked', item: T): void
  (e: 'update:selectedItemsID', value: string[]): void
}>()
const selectedItems = defineModel<T[]>([])
const selectedItemsID = ref<string[]>([])
const itemsID = computed(() => props.items.map((item) => item.id))

// Local reactive state instead of global store
const localHeaders = ref<TableHeader[]>([])
const localData = ref<any[]>([])
const originalData = ref<any[]>([])
const localIsLoading = ref(false)
const sortStates = ref<{ key: string; order: SortOrder }[]>([])

// Initialize headers with defaults
const initializeHeaders = (newHeaders: TableHeader[]) => {
  localHeaders.value = newHeaders.map((header) => ({
    ...header,
    visible: header.visible ?? true,
    sortable: header.sortable ?? false,
    sortOrder: header.sortOrder ?? null,
  }))
}

// Initialize data
const initializeData = (newData: any[]) => {
  localData.value = newData
  originalData.value = newData
}

// Watch for prop changes
watch(
  () => props.items,
  (newItems) => {
    initializeData(newItems)
  },
  { immediate: true }
)

watch(
  () => props.headers,
  (newHeaders) => {
    initializeHeaders(newHeaders)
  },
  { immediate: true }
)

watch(
  selectedItemsID,
  (newValue) => {
    emits('update:selectedItemsId', newValue)
  },
  { immediate: true }
)

const allitemsSelectedIndicator = computed(() =>
  props.items?.length ? props.items.every((o) => selectedItemsID.value.includes(o.id)) : false
)

const itemSelected = (item: T) => selectedItemsID.value?.includes(item.id)

function itemToggle(item: T) {
  const isSelected = itemSelected(item)

  selectedItemsID.value = isSelected
    ? selectedItemsID.value?.filter((id) => id !== item.id)
    : [...selectedItemsID.value, item.id]

  selectedItems.value = isSelected
    ? selectedItems.value.filter((o) => o.id !== item.id)
    : [...selectedItems.value, item]
}

function toggleAllItems() {
  const shouldDeselect = allitemsSelectedIndicator.value
  if (shouldDeselect) {
    const currentIds = new Set(itemsID.value)

    selectedItemsID.value = selectedItemsID.value.filter((id) => !currentIds.has(id))

    selectedItems.value = selectedItems.value.filter((item) => !currentIds.has(item.id))
  } else {
    const newItems = props.items.filter((o) => !selectedItemsID.value.includes(o.id))
    const newItemsIds = newItems.map((o) => o.id)
    selectedItemsID.value = [...selectedItemsID.value, ...newItemsIds]
    selectedItems.value = [...selectedItems.value, ...newItems]
  }
}
// Computed properties
const isLoading = computed(() => localIsLoading.value || props.isLoading)
const headers = computed(() => {
  return localHeaders.value.filter((header) => header.visible !== false)
})
const data = computed(() => localData.value)

// Column visibility methods
const toggleColumnVisibility = (key: string) => {
  const header = localHeaders.value.find((h) => h.key === key)
  if (header) {
    header.visible = !header.visible
  }
}

const setColumnVisibility = (key: string, visible: boolean) => {
  const header = localHeaders.value.find((h) => h.key === key)
  if (header) {
    header.visible = visible
  }
}

// Sorting methods
const sortColumn = (key: string, order: SortOrder) => {
  // Reset all other headers' sort order
  localHeaders.value.forEach((header) => {
    if (header.key !== key) {
      header.sortOrder = null
    } else {
      header.sortOrder = order
    }
  })

  if (!order) {
    localData.value = [...originalData.value]
    return
  }

  localData.value = orderBy(originalData.value, [key], [order])
}

const sortData = () => {
  const sortKeys = []
  const sortOrder = []
  for (const sortState of sortStates.value) {
    sortKeys.push(sortState.key)
    sortOrder.push(sortState.order)
  }
  localData.value = orderBy(originalData.value, sortKeys, sortOrder)
}

// Loading methods
const setLoading = (status: boolean) => {
  localIsLoading.value = status
}

const toggleLoading = () => {
  localIsLoading.value = !localIsLoading.value
}

const slots = useSlots()
const hasSlot = (name: string) => !!slots[name]
const headerSlots = computed(() => {
  return Object.keys(slots).filter((name) => name.startsWith('header-'))
})

const dataSlotsKeys = computed(() => {
  return Object.keys(slots).filter((name) => name.startsWith('data-'))
})

const slotName = (slot: string): keyof GenerateSlots<T> => {
  return slot as keyof GenerateSlots<T>
}

defineSlots<GenerateSlots<T>>()

const isRowHighlighted = (rowId: string) => {
  return props.highlightedRows?.includes(rowId)
}

// Register with AppCrud if available - moved after headers initialization
const registerAppTable = inject<((context: any) => void) | null>('registerAppTable', null)

// Create the table context object
const createTableContext = () => ({
  headers: readonly(localHeaders),
  toggleColumnVisibility,
  setColumnVisibility,
  sortColumn,
  sortData,
  setLoading,
  toggleLoading,
})

// Provide table methods for descendant components (like TableColumnChooser)
provide('appTable', createTableContext())

// Register with AppCrud after headers are initialized
watchEffect(() => {
  if (registerAppTable && localHeaders.value.length > 0) {
    registerAppTable(createTableContext())
  }
})

// Expose methods for external use if needed
defineExpose({
  toggleColumnVisibility,
  setColumnVisibility,
  sortColumn,
  sortData,
  setLoading,
  toggleLoading,
  headers: readonly(localHeaders),
  data: readonly(localData),
})
</script>
<template>
  <div class="h-full w-full">
    <div class="overflow-x-auto">
      <table v-if="!isLoading" class="min-w-full">
        <TableHeadersGenerator
          class="w-full"
          :headers="headers"
          :has-select="hasSelect ?? false"
          v-model="allitemsSelectedIndicator"
          @check="() => toggleAllItems()"
        >
          <template v-for="headerSlot in headerSlots" #[headerSlot]>
            <slot :name="slotName(headerSlot)" />
          </template>
        </TableHeadersGenerator>
        <TairoTableRow v-if="hasSlot('before-data')">
          <TairoTableCell>
            <slot name="before-data" />
          </TairoTableCell>
        </TairoTableRow>

        <tr
          v-for="(item, index) in data"
          :id="`row-${item[rowKey as keyof T]}`"
          :key="`row-${item[rowKey as keyof T]}`"
          :class="{ 'row-higthlight': isRowHighlighted(item[rowKey as keyof T]) }"
          @click="() => emits('row-clicked', item)"
        >
          <td v-if="hasSelect ?? false" spaced>
            <span class="text-sm">
              <BaseCheckbox
                @click.stop
                class="mx-2 !size-4"
                :checked="itemSelected(item)"
                @change="itemToggle(item)"
              />
            </span>
          </td>
          <td v-for="header in headers" :key="`table-header-${header.key}`" spaced>
            <span v-if="!hasSlot(`data-${header.key}`)">
              {{ get(item, header.key) ? get(item, header.key) : '-' }}
            </span>
            <slot v-else :name="slotName(`data-${header.key}`)" :item="item" :index="index" />
          </td>
        </tr>
        <TableNoData v-if="data?.length == 0 && !isLoading && !hideNoData" :cols="headers.length" />
      </table>
      <table v-else class="min-w-full">
        <TableLoading :columns="headers.length" :rows="5" />
      </table>
    </div>
    <slot name="default" />
  </div>
</template>
<style lang="scss">
table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  border-spacing: 0 4px;

  th {
    background: #698596;
    color: #fff;
    font-size: 14px;
    text-align: center !important;
    font-weight: bold;
    padding: 14px;
    white-space: nowrap;
    border: 1px solid #fff;

    @media (max-width: 768px) {
      font-size: 12px;
      padding: 8px 6px;
    }

    @media (max-width: 480px) {
      font-size: 11px;
      padding: 6px 4px;
    }
  }

  th:first-child {
    border-start-start-radius: 1000px;
    border-end-start-radius: 1000px;
  }

  th:last-child {
    border-start-end-radius: 1000px;
    border-end-end-radius: 1000px;
  }

  tr {
    margin: 4rem;
    background: #f5f5f5;
  }

  // make tr striped
  tr:nth-child(even) {
    background: #ffffff;
  }

  td:first-child {
    border-start-start-radius: 8px;
    border-end-start-radius: 8px;
  }

  td:last-child {
    border-start-end-radius: 8px;
    border-end-end-radius: 8px;
  }

  td {
    color: #000;
    font-weight: 400;
    text-align: center;
    padding: 0.8rem;
    font-size: 14px;
    white-space: nowrap;
    /* Prevent cell content wrapping */

    @media (max-width: 768px) {
      font-size: 12px;
      padding: 0.6rem 0.4rem;
    }

    @media (max-width: 480px) {
      font-size: 11px;
      padding: 0.5rem 0.3rem;
    }
  }

  .row-higthlight {
    font-size: 14px;
    text-align: center !important;
    font-weight: bold;

    td {
      overflow: hidden;
      border-top: 1px solid #0bcb14;
      border-bottom: 1px solid #0bcb14;
      background: rgba(198, 255, 167, 0.2) !important;
      border-top: 1px solid #0bcb14;
      border-bottom: 1px solid #0bcb14;
    }

    td:first-child {
      border-inline-start: 1px solid #0bcb14;
    }

    td:last-child {
      border-inline-end: 1px solid #0bcb14;
    }

    @media (max-width: 768px) {
      font-size: 12px;
    }

    @media (max-width: 480px) {
      font-size: 11px;
    }
  }
}
</style>
