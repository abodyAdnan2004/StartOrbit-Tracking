<script setup lang="ts">
import DeleteModal from './components/DeleteModal.vue'
import type { AppCrudProps } from '~/common/components/app-crud/types/index'
const props = withDefaults(defineProps<AppCrudProps>(), {
  addText: 'اضافة',
  totalPages: 0,
  hideAdd: false,
  // toRefresh:,
})
const showAddButton = computed(() => !props.hideAdd)
const emits = defineEmits(['update:currentPage'])
const route = useRoute()
const currentPage = computed(() => {
  try {
    return Number.parseInt(route.query.pageNumber as string) || 1
  } catch {
    return 1
  }
})
watch(currentPage, (val) => {
  emits('update:currentPage', val)
})
const slots = useSlots()
const hasSlot = (name: string) => !!slots[name]
const isFiltersOpen = ref(false)
</script>
<template>
  <div class="rounded-lg border bg-white p-5 shadow-md">
    <div class="flex w-full items-center justify-between rounded-lg bg-white p-3">
      <CollapsibleRoot class="flex min-h-0 flex-1 flex-col">
        <TairoContentWrapper>
          <template #top v-if="hasSlot('filters')">
            <div class="my1 flex w-full flex-col justify-start gap-4">
              <div class="grid grid-cols-3 gap-4">
                <slot name="filters" />
              </div>
            </div>
          </template>
          <template #bot>
            <CollapsibleTrigger v-if="hasSlot('additional-filters')">
              <BaseButtonIcon
                :color="!isFiltersOpen ? 'none' : 'dark'"
                @click="isFiltersOpen = !isFiltersOpen"
              >
                <Icon name="carbon:filter-edit" size="23" />
              </BaseButtonIcon>
            </CollapsibleTrigger>
            <slot name="headerActions" />
            <div class="flex gap-4">
              <BaseButton v-if="showAddButton" class="gap-1" color="primary" @click="addAction">
                <Icon name="ph-plus-circle-duotone" size="20" />
                {{ addText }}
              </BaseButton>
            </div>
          </template>
        </TairoContentWrapper>
      </CollapsibleRoot>
    </div>
    <transition name="slide-fade">
      <div v-if="isFiltersOpen" class="my-2 rounded-lg bg-white p-5">
        <h1 class="mb-2 text-lg font-bold">فلترة البيانات</h1>
        <slot name="additional-filters" />
      </div>
    </transition>
    <TairoContentWrapper class="mt-2">
      <slot />
      <BasePagination
        v-if="totalPages && totalPages > 1"
        v-model:current-page="currentPage"
        router-query-key="pageNumber"
        class="mt-2"
        :item-per-page="10"
        :total-items="totalPages! * 10"
        :max-links-displayed="10"
        rounded="lg"
      />
    </TairoContentWrapper>
  </div>
  <DeleteModal />
</template>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-enter-to {
  transform: translateY(0);
  opacity: 1;
}

.slide-fade-leave-from {
  transform: translateY(0);
  opacity: 1;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
