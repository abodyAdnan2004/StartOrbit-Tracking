<script lang="ts" setup>
import { onClickOutside, watchDebounced } from '@vueuse/core'
import type { ErrorObject } from '@vuelidate/core'
import {
  computed,
  defineModel,
  defineProps,
  defineSlots,
  defineEmits,
  onMounted,
  onUnmounted,
  ref,
  watch,
  nextTick,
  useId,
  useTemplateRef,
  withDefaults,
} from 'vue'
import axiosIns from '~/common/services/app-client/axios'

// Type definitions
export interface AutoCompleteProps<T> {
  // Data source
  items?: T[]
  getUrl?: string
  defaultParams?: Record<string, any>
  searchKey?: string
  itemLabel?: string
  itemValue?: string
  itemSubTitle?: string

  // Behavior
  multiple?: boolean
  show?: number
  hideSelectAll?: boolean
  clearable?: boolean
  disabled?: boolean
  fetchOnSearch?: boolean
  exclude?: (string | number)[]
  excludeOnFetch?: string

  // Validation (Base-Dashboard pattern)
  errors?: ErrorObject[]
  label?: string
  placeholder?: string

  // Advanced
  actions?: Array<{ label: string; icon?: string; callback: () => void }>
}

const props = withDefaults(defineProps<AutoCompleteProps<any>>(), {
  itemLabel: 'name',
  itemValue: 'id',
  show: 20,
  multiple: false,
  hideSelectAll: false,
  clearable: true,
  fetchOnSearch: false,
  disabled: false,
})

// Computed helpers
const searchKey = computed(() => props.searchKey || props.itemLabel || 'name')
const onlySelect = computed(() => !props.getUrl && props.items)

const cond = computed(() => {
  if (search.value) return true
  const m = model.value
  if (m === undefined || m === null || m === '') return false
  if (Array.isArray(m)) return m.length > 0
  return true
})

const placeholder = computed(() => {
  if (props.placeholder) return props.placeholder
  if (props.items) return props.items.map((i) => i[props.itemLabel]).join(', ')
  return props.label
})

const label = computed(() => {
  return props.label ? props.label + (props.label && props.errors?.length ? '*' : '') : ''
})

// Validation - Base-Dashboard pattern (like AppInputField)
const error = computed(() =>
  props.errors?.length ? props.errors.map((e) => e.$message).join(', ') : ''
)

const emit = defineEmits([
  'update:modelValue',
  'update:objectValue',
  'update:getResponse',
  'create:item',
])

// Model definitions (v-model support)
const model = defineModel<any>()

const modelObject = defineModel<Record<string, any> | Array<Record<string, any>>>('object')

// Slots
defineSlots<{
  item(props: { item: any }): unknown
  subtitle(props: { item: any }): unknown
}>()

// State
const search = ref('')
const isMenuOpen = ref(false)
const isHovering = ref(false)
const selectedItems = ref<Record<string, any>[]>([])

// Data fetching state (Base-Dashboard pattern: manual ref instead of vue-query)
const fetchedItems = ref<Record<string, any>[]>([])
const isFetching = ref(false)

// UI Refs
const menu = useTemplateRef<HTMLElement>('menu')
const dropdownEl = useTemplateRef<HTMLElement>('dropdownEl')
const anchorId = useId()
const menuWidth = ref('0px')

function syncMenuWidth() {
  if (menu.value) {
    const w = menu.value.clientWidth
    menuWidth.value = w > 0 ? `${w}px` : 'min(100vw, 20rem)'
  }
}

// Data Fetching (Base-Dashboard pattern: manual axios with debounced search)
const fetchData = async (searchTerm: string) => {
  if (!props.getUrl) return []

  const params: Record<string, any> = {
    ...props.defaultParams,
    pageSize: props.show,
    pageNumber: 1,
    [searchKey.value]: searchTerm,
  }

  // excludeOnFetch: Send currently selected IDs to backend to avoid fetching them
  if (props.excludeOnFetch && selectedItems.value.length > 0) {
    params[props.excludeOnFetch] = selectedItems.value.map((i) => i[props.itemValue])
  }

  isFetching.value = true
  try {
    const { data } = await axiosIns.get(props.getUrl, { params })
    emit('update:getResponse', data)
    const items = Array.isArray(data) ? data : data.data || []
    fetchedItems.value = items
    return items
  } catch (err) {
    console.error('Fetch error:', err)
    fetchedItems.value = []
    return []
  } finally {
    isFetching.value = false
  }
}

// Debounced search (Base-Dashboard pattern using @vueuse/core)
if (props.getUrl && props.fetchOnSearch) {
  watchDebounced(
    search,
    (newSearch) => {
      if (isMenuOpen.value) {
        fetchData(newSearch)
      }
    },
    { debounce: 300 }
  )
}

// Initial fetch if needed
onMounted(() => {
  if (props.getUrl && !props.fetchOnSearch) {
    fetchData('')
  }
})

// Selection Logic
function optionIdKey(item: any, idKey: string): string {
  if (!item) return ''
  const v = item[idKey]
  if (v === null || v === undefined) return ''
  return String(v)
}

// Get the ID key from an item using props.itemValue
function getItemId(item: any): string {
  return optionIdKey(item, props.itemValue ?? 'id')
}

const isSelected = (item: any) => {
  if (!item) return false
  const key = getItemId(item)
  if (!key) return false
  return selectedItems.value.some((i) => getItemId(i) === key)
}

const toggleEntry = (item: any) => {
  const itemKey = getItemId(item)

  if (props.multiple) {
    const index = selectedItems.value.findIndex((i) => getItemId(i) === itemKey)
    if (index > -1) {
      selectedItems.value.splice(index, 1)
    } else {
      selectedItems.value.push(item)
    }
  } else {
    const modelKey =
      model.value === null || model.value === undefined || model.value === ''
        ? ''
        : String(model.value)
    if (itemKey === modelKey) {
      selectedItems.value = []
    } else {
      selectedItems.value = [item]
      search.value = ''
      isMenuOpen.value = false
    }
  }
  updateModels()
}

const updateModels = () => {
  const idKey = props.itemValue
  if (props.multiple) {
    model.value = selectedItems.value.map((i) => i[idKey])
    modelObject.value = [...selectedItems.value] as any[]
  } else {
    const item = selectedItems.value[0] as Record<string, any> | undefined
    model.value = item != null ? item[idKey] : undefined
    modelObject.value = (item ?? undefined) as any
  }
}

// Sticky Selection Logic - finalOptions computed (from schools-frontend)
// Selected items stay at the top, unselected items below
const finalOptions = computed(() => {
  const idKey = props.itemValue ?? 'id'
  const labelKey = props.itemLabel ?? 'name'

  let source: any[] =
    props.items !== undefined && props.items.length > 0 ? props.items : (fetchedItems.value ?? [])

  if (props.items !== undefined && props.items.length > 0) {
    const term = search.value.toLowerCase()
    source = source.filter((item) => {
      if (!item) return false
      const id = item[idKey]
      const label = String(item[labelKey] ?? '').toLowerCase()
      const matchesSearch = !term || label.includes(term)
      const isNotExcluded = !props.exclude?.includes(id)
      return matchesSearch && isNotExcluded
    })
  } else {
    source = source.filter((item: any) => {
      const id = item[idKey]
      return !props.exclude?.includes(id)
    })
  }

  const selectedKeys = new Set(selectedItems.value.map(getItemId))
  const unselected = source.filter((item) => {
    if (!item) return false
    const k = getItemId(item)
    if (!k) return false
    return !selectedKeys.has(k)
  })

  const merged = [...selectedItems.value, ...unselected]
  const seenKeys = new Set<string>()
  return merged.filter((item) => {
    if (!item) return false
    const id = item[idKey]
    if (props.exclude?.includes(id)) return false
    const k = getItemId(item)
    if (!k) return false
    if (seenKeys.has(k)) return false
    seenKeys.add(k)
    return true
  })
})

function modelIsEmpty(v: unknown): boolean {
  return v === undefined || v === null || (Array.isArray(v) && v.length === 0)
}

// Sync internal selection from v-model
async function syncSelectionFromModel(v: unknown) {
  if (modelIsEmpty(v)) {
    selectedItems.value = []
    return
  }

  const idKey = props.itemValue ?? 'id'
  const incomingIds = Array.isArray(v) ? v : [v]
  const currentIds = selectedItems.value.map((i) => i[idKey])
  const needsSync =
    incomingIds.length !== currentIds.length ||
    incomingIds.some((id) => !currentIds.some((c) => c == id))

  if (!needsSync) return

  if (modelObject.value != null) {
    const mo = modelObject.value
    const moArr = Array.isArray(mo) ? mo : [mo]
    const moIds = moArr.map((x) => x[idKey])
    const objectMatchesModel =
      incomingIds.length === moIds.length && incomingIds.every((id, i) => moIds[i] == id)
    if (objectMatchesModel) {
      selectedItems.value = moArr.map((x) => ({ ...x }))
      return
    }
  }

  if (props.items !== undefined && props.items.length > 0) {
    const found = props.items.filter((item) => incomingIds.some((id) => item[idKey] == id))
    if (found.length) {
      selectedItems.value = props.multiple ? found : [found[0]]
    }
    return
  }

  if (props.getUrl) {
    try {
      const promises = incomingIds.map((id) => axiosIns.get(`${props.getUrl}/${id}`))
      const responses = await Promise.all(promises)
      selectedItems.value = responses.map((r) => r.data)
    } catch (e) {
      console.error('Hydration failed', e)
    }
  }
}

// Display Text
const displayText = computed(() => {
  if (selectedItems.value.length === 0) return
  const firstLabel = selectedItems.value[0]?.[props.itemLabel]

  if (props.multiple && selectedItems.value.length > 1) {
    return `${firstLabel} (+${selectedItems.value.length - 1})`
  }
  return firstLabel
})

const selectAll = () => {
  const options = finalOptions.value
  if (selectedItems.value.length === options.length && options.length > 0) {
    selectedItems.value = []
  } else {
    // Select all available options (both already selected and unselected)
    selectedItems.value = [...options]
  }
  updateModels()
  if (!props.multiple) {
    isMenuOpen.value = false
  }
}

const clear = () => {
  selectedItems.value = []
  search.value = ''
  updateModels()
  isMenuOpen.value = true
}

// Create new item (from Base-Dashboard)
const createNewItem = () => {
  if (!search.value.trim()) return

  const newItem = {
    [props.itemLabel!]: search.value,
    [props.itemValue!]: search.value,
    isNew: true,
  }

  toggleEntry(newItem)
  emit('create:item', newItem)
}

// Lifecycle
onMounted(() => {
  onClickOutside(
    menu,
    () => {
      isMenuOpen.value = false
    },
    { ignore: [dropdownEl] }
  )
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      menuWidth.value = `${entry.contentRect.width}px`
    }
  })

  if (menu.value) {
    observer.observe(menu.value)
    syncMenuWidth()
  }

  // Initial hydration from modelValue
  if (model.value !== undefined && model.value !== null && model.value !== '') {
    syncSelectionFromModel(model.value)
  }
})

onUnmounted(() => {
  // Cleanup if needed
})

watch(isMenuOpen, (open) => {
  if (open) {
    nextTick(() => syncMenuWidth())
  }
})

watch(
  () => model.value,
  async (newVal) => {
    await syncSelectionFromModel(newVal)
  },
  { deep: true, immediate: true }
)

watch(
  modelObject,
  (v) => {
    emit('update:objectValue', v)
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <div ref="menu" class="autocomplete-wrapper" :style="{ '--anchor-id': anchorId }">
    <div class="flex flex-col items-start">
      <label v-if="label" class="nui-text-label mb-1">{{ label }}</label>
      <BaseButton
        class="!flex !h-10 w-full items-center !rounded-2xl !border !pl-0 !pr-0.5 transition-colors"
        :class="[error && '!border-red-500', props.disabled && '!bg-[#EEE]']"
        @mouseenter="isHovering = true"
        @mouseleave="isHovering = false"
        type="button"
        @click="
          () => {
            if (!props.disabled) isMenuOpen = !isMenuOpen
          }
        "
      >
        <div
          v-if="selectedItems.length > 0 && displayText"
          class="ml-auto flex shrink-0 items-center gap-1"
        >
          <span
            class="rounded-xl border border-primary-100 bg-primary-300/50 px-2 py-1 text-sm font-semibold text-primary-500/80"
          >
            {{ displayText }}
          </span>
        </div>

        <!-- Selected items tags for multiple selection (sticky selection pattern) -->
        <!-- <div v-if="props.multiple && selectedItems.length > 0" class="mr-2 flex flex-wrap items-center gap-1">
          <BaseTag
            v-for="item in selectedItems"
            :key="getItemId(item)"
            color="primary"
            variant="pastel"
            class="flex items-center gap-1 text-sm"
          >
            {{ item[props.itemLabel] }}
            <button type="button" class="p-0" @click.stop="toggleEntry(item)">
              <Icon name="ph:x" class="size-3" />
            </button>
          </BaseTag>
        </div> -->

        <span
          v-else-if="onlySelect"
          class="pointer-events-none flex min-w-0 grow select-none items-center truncate !px-2 text-sm text-[#cdd7e2]"
          :class="isHovering ? '!bg-slate-50/50' : ''"
        >
          {{ placeholder ?? label }}
        </span>

        <BaseInput
          v-if="!onlySelect"
          :disabled="props.disabled"
          v-model="search"
          :classes="{
            wrapper: 'grow !border-0 !outline-0',
          }"
          class="grow !border-0 !px-2 !outline-none"
          :class="isHovering ? '!bg-slate-50/50' : ''"
          :placeholder="!(selectedItems.length > 0 && displayText) ? placeholder : ''"
        />

        <div class="mr-auto flex shrink-0 items-center">
          <button
            type="button"
            v-if="cond && props.clearable"
            class="flex size-8 items-center justify-center text-muted-400 transition-colors duration-300 hover:text-primary-500"
            @click.stop="clear"
          >
            <Icon name="ph:x" class="size-5" />
          </button>
          <button
            type="button"
            v-if="!cond && !onlySelect"
            class="flex size-8 cursor-default items-center justify-center text-muted-400 transition-colors duration-300"
          >
            <Icon name="hugeicons:search-02" class="size-5" />
          </button>
          <button
            v-if="!cond && onlySelect"
            type="button"
            class="flex size-8 h-full items-center justify-center text-[#162F3B] transition-all duration-300"
            :class="isMenuOpen ? 'rotate-180' : ''"
          >
            <Icon name="hugeicons:arrow-down-01" class="size-5" />
          </button>
        </div>
      </BaseButton>

      <!-- Error display (Base-Dashboard pattern) -->
      <BaseInputHelpText v-if="error && typeof error === 'string'" color="danger">
        {{ error }}
      </BaseInputHelpText>
    </div>

    <div
      ref="dropdownEl"
      v-if="isMenuOpen"
      class="autocomplete-dropdown fixed z-50 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white/80 px-2 shadow-2xl backdrop-blur-xl"
      role="listbox"
      :aria-expanded="isMenuOpen"
      :style="{
        width: menuWidth,
        top: 'anchor(bottom)',
        left: 'anchor(left)',
      }"
    >
      <!-- Select All (from schools-frontend) -->
      <div
        v-if="props.multiple && finalOptions.length && !props.hideSelectAll"
        @click="selectAll"
        class="mx-2 my-2 flex cursor-pointer place-items-center gap-2 rounded-lg border-b border-slate-100 px-4 py-1 text-center transition-colors"
        :class="
          selectedItems.length === finalOptions.length && finalOptions.length > 0
            ? 'bg-primary-500/70 text-white hover:bg-primary-400/80'
            : 'text-slate-800 hover:bg-primary-500/30'
        "
      >
        <BaseCheckbox
          :checked="selectedItems.length === finalOptions.length && finalOptions.length > 0"
          class="pointer-events-none rounded border-slate-300"
        />
        <span class="text-xs font-bold">اختيار الكل</span>
      </div>

      <div class="custom-scrollbar max-h-[300px] overflow-y-auto">
        <div v-if="isFetching && !finalOptions.length" class="flex justify-center p-8">
          <Icon name="svg-spinners:180-ring" class="size-6 text-primary-500" />
        </div>

        <div
          v-for="option in finalOptions"
          :key="getItemId(option)"
          @click="toggleEntry(option)"
          class="mx-2 my-1 flex cursor-pointer place-items-center gap-2 rounded-lg px-4 py-1 transition-colors"
          :class="
            isSelected(option)
              ? 'bg-primary-500/70 text-white hover:bg-primary-400/80'
              : 'text-slate-800 hover:bg-primary-500/30'
          "
        >
          <BaseCheckbox v-if="props.multiple" :checked="isSelected(option)" class="mt-1" />

          <div class="flex grow flex-col">
            <slot name="item" :item="option">
              <span class="text-md font-medium">
                {{ option[props.itemLabel] }}
              </span>
            </slot>

            <slot name="subtitle" :item="option">
              <span v-if="props.itemSubTitle" class="line-clamp-1 text-[11px] text-slate-500">
                {{ option[props.itemSubTitle] }}
              </span>
            </slot>
          </div>

          <Icon
            v-if="!props.multiple && isSelected(option)"
            name="ph:check-bold"
            class="size-4 self-center text-white"
          />
        </div>

        <!-- Actions (from schools-frontend) -->
        <div
          v-if="props.actions && props.actions.length > 0"
          :key="action.label"
          v-for="action in props.actions"
        >
          <div
            class="mx-2 my-2 flex cursor-pointer place-items-center gap-2 rounded-lg border border-slate-100 px-4 py-1 text-center transition-colors hover:bg-slate-300"
          >
            <button
              v-if="action && action.callback"
              class="flex w-full items-center justify-center gap-2 p-2"
              @click="action.callback"
            >
              <Icon :name="action.icon ?? 'ph:plus-circle'" class="size-5 text-primary-600" />
              <span>{{ action.label ?? 'إضافة' }}</span>
            </button>
          </div>
        </div>

        <div
          v-if="!isFetching && !finalOptions.length"
          class="p-8 text-center text-xs text-slate-400"
        >
          No results found
        </div>
      </div>

      <div
        v-if="isFetching && finalOptions.length"
        class="flex justify-center border-t border-slate-100 bg-slate-50/50 p-2"
      >
        <Icon name="svg-spinners:180-ring" class="size-4 text-slate-400" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.autocomplete-wrapper {
  anchor-name: v-bind("'--anchor-' + anchorId");
}

.autocomplete-dropdown {
  /* Using CSS Anchor Positioning with fallback logic */
  position: absolute;
  position-anchor: v-bind("'--anchor-' + anchorId");
  top: anchor(bottom);
  position-visibility: always;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #5089d2;
  border-radius: 10px;
}
</style>
