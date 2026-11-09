<script setup lang="ts">
import AppCrudActions from '~/common/components/app-crud/components/AppCrudActions.vue'
import AppTable from '~/common/components/app-table/AppTable.vue'
import { useAppTableStore } from '~/common/components/app-table/stores/AppTableStore'
import { tableHeader } from '~/features/departments'
import DepartmentCreate from '~/features/departments/components/DepartmentCreate.vue'
import DepartmentEdit from '~/features/departments/components/DepartmentEdit.vue'
import { useDepartmentStore } from '~/features/departments/store'
import type { DepartmentFilters } from '~/features/departments/types'

definePageMeta({
  title: 'Departments',
  description: 'Creating and managing departments',
})

const departmentStore = useDepartmentStore()
const appTableStore = useAppTableStore()
const isLoading = computed(() => departmentStore.isLoading)
const departments = computed(() => departmentStore.departments || [])
const filters = computed<DepartmentFilters>({
  get() {
    return departmentStore.filters
  },
  set(value) {
    departmentStore.filters = value
  },
})

const getDepartments = async () => {
  appTableStore.setLoading(true)
  await departmentStore.getDepartments()
  appTableStore.setLoading(false)
}

getDepartments()
watch(
  filters,
  () => {
    getDepartments()
  },
  { deep: true }
)
onUnmounted(() => {
  departmentStore.filters = {
    pageSize: 10,
    pageNumber: 1,
    name: null,
    code: null,
    managerId: null,
  }
})

enum WeekDays {
  isSundayWorkDay = 1,
  isMondayWorkDay,
  isTuesdayWorkDay,
  isWednesdayWorkDay,
  isThursdayWorkDay,
  isFridayWorkDay,
  isSaturdayWorkDay,
}

const weekDays: AppEnumGroup = [
  {
    name: 'isSundayWorkDay',
    value: WeekDays.isSundayWorkDay,
    color: 'primary',
    arName: 'ألاحد',
  },
  {
    name: 'isMondayWorkDay',
    value: WeekDays.isMondayWorkDay,
    color: 'primary',
    arName: 'ألاثنين',
  },
  {
    name: 'isTuesdayWorkDay',
    value: WeekDays.isTuesdayWorkDay,
    color: 'primary',
    arName: 'ألثلاثاء',
  },
  {
    name: 'isWednesdayWorkDay',
    value: WeekDays.isWednesdayWorkDay,
    color: 'primary',
    arName: 'ألاربعاء',
  },
  {
    name: 'isThursdayWorkDay',
    value: WeekDays.isThursdayWorkDay,
    color: 'primary',
    arName: 'ألخميس',
  },
  {
    name: 'isFridayWorkDay',
    value: WeekDays.isFridayWorkDay,
    color: 'primary',
    arName: 'ألجمعة',
  },
  {
    name: 'isSaturdayWorkDay',
    value: WeekDays.isSaturdayWorkDay,
    color: 'primary',
    arName: 'ألسبت',
  },
]
</script>

<template>
  <div>
    <AppCrud
      add-text="Add New Department"
      :add-action="() => (departmentStore.isCreateDialogOpen = true)"
      :total-pages="departmentStore.totalPages"
      @update:current-page="filters.pageNumber = $event"
    >
      <template #filters>
        <AppInputField v-model="filters.name" placeholder="Search" />
        <AppAutoCompleteField
          placeholder="weekDays"
          :items="weekDays"
          item-label="arName"
          item-value="value"
          multiple
        />
        <AppAutoCompleteField
          v-model="filters.managerId"
          placeholder="Manager"
          item-label="fullName"
          item-value="id"
        />
      </template>
      <template #additional-filters></template>
      <AppTable :headers="tableHeader()" :items="departments" :is-loading="isLoading">
        <template #data-name="{ item }">
          <div class="flex flex-col">
            <span class="font-medium text-muted-800 dark:text-muted-100">
              {{ item.name }}
            </span>
            <span v-if="item.description" class="text-xs text-muted-500">
              {{ item.description }}
            </span>
          </div>
        </template>

        <template #data-code="{ item }">
          <BaseTag color="primary" variant="pastel" size="sm">
            {{ item.code }}
          </BaseTag>
        </template>

        <template #data-manager="{ item }">
          <div v-if="item.manager" class="flex flex-col">
            <span class="font-medium text-muted-800 dark:text-muted-100">
              {{ item.manager.fullName }}
            </span>
            <span class="text-xs text-muted-500">
              {{ item.manager.email }}
            </span>
          </div>
          <span v-else class="text-muted-400">No Manager</span>
        </template>

        <template #data-parentDepartment="{ item }">
          <span v-if="item.parentDepartment" class="text-muted-800 dark:text-muted-100">
            {{ item.parentDepartment.name }}
          </span>
          <span v-else class="text-muted-400">Top Level</span>
        </template>

        <template #data-budget="{ item }">
          <span v-if="item.budget" class="font-medium text-muted-800 dark:text-muted-100">
            ${{ item.budget.toLocaleString() }}
          </span>
          <span v-else class="text-muted-400">No Budget</span>
        </template>

        <template #data-location="{ item }">
          <span v-if="item.location" class="text-muted-800 dark:text-muted-100">
            {{ item.location }}
          </span>
          <span v-else class="text-muted-400">No Location</span>
        </template>

        <template #data-actions="{ item }">
          <AppCrudActions
            :item="item"
            :edit-button-action="
              () => {
                departmentStore.selectedDepartment = item
                departmentStore.selectedDepartmentId = item.id
                departmentStore.isEditDialogOpen = true
              }
            "
            :delete-service="(id: string) => departmentStore.deleteDepartment(Number(id))"
          />
        </template>
      </AppTable>
    </AppCrud>
    <DepartmentCreate />
    <DepartmentEdit />
  </div>
</template>
