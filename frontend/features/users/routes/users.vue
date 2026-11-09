<script setup lang="ts">
import AppCrudActions from '~/common/components/app-crud/components/AppCrudActions.vue'
import AppTable from '~/common/components/app-table/AppTable.vue'
import { useAppTableStore } from '~/common/components/app-table/stores/AppTableStore'
import { tableHeader } from '~/features/users'
import UserCreate from '~/features/users/components/UserCreate.vue'
import UserEdit from '~/features/users/components/UserEdit.vue'
import { useUserStore } from '~/features/users/store'
import type { UserFilters } from '~/features/users/types'

definePageMeta({ title: 'Users' })

const store = useUserStore()
const appTableStore = useAppTableStore()

const items = computed(() => store.items || [])
const isLoading = computed(() => store.isLoading)

const filters = computed<UserFilters>({
  get: () => store.filters,
  set: (value) => {
    store.filters = value
  },
})

const fetchAll = async () => {
  appTableStore.setLoading(true)
  await store.getAll()
  appTableStore.setLoading(false)
}

fetchAll()

watch(filters, () => fetchAll(), { deep: true })

onUnmounted(() => {
  store.filters = { pageNumber: 1, pageSize: 20, search: null, roleId: null, isActive: null }
})
</script>

<template>
  <div>
    <AppCrud
      title="Users"
      add-button-text="Add User"
      :add-btn-action="() => (store.isCreateDialogOpen = true)"
      :pagination="true"
      :total-pages="store.totalPages"
      @update:current-page="filters.pageNumber = $event"
    >
      <template #filters>
        <BaseInput v-model="filters.search" placeholder="Search users..." />
      </template>

      <AppTable
        title="Users"
        :headers="tableHeader()"
        :items="items"
        :is-loading="isLoading"
      >
        <template #data-employeeId="{ item }">
          <span class="font-mono text-sm">{{ item.employeeId }}</span>
        </template>

        <template #data-username="{ item }">
          <span class="font-medium">{{ item.username }}</span>
        </template>

        <template #data-email="{ item }">
          <span class="text-gray-600">{{ item.email }}</span>
        </template>

        <template #data-fullName="{ item }">
          <span class="font-medium">{{ item.fullName }}</span>
        </template>

        <template #data-phoneNumber="{ item }">
          <span class="text-gray-600">{{ item.phoneNumber || '-' }}</span>
        </template>

        <template #data-role="{ item }">
          <BaseBadge
            :color="item.role.isSystemRole ? 'purple' : 'blue'"
            :dot="true"
          >
            {{ item.role.name }}
          </BaseBadge>
        </template>

        <template #data-isActive="{ item }">
          <BaseBadge :color="item.isActive ? 'green' : 'red'" :dot="true">
            {{ item.isActive ? 'Active' : 'Inactive' }}
          </BaseBadge>
        </template>

        <template #data-actions="{ item }">
          <AppCrudActions
            :item="item"
            :edit-button-action="
              () => {
                store.setSelected(item)
                store.isEditDialogOpen = true
              }
            "
            :delete-service="store.remove"
          />
        </template>
      </AppTable>
    </AppCrud>

    <UserCreate />
    <UserEdit />
  </div>
</template>