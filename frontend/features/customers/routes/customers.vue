<script setup lang="ts">
import AppCrud from '~/common/components/app-crud/AppCrud.vue'
import AppTable from '~/common/components/app-table/AppTable.vue'
import AppInputField from '~/common/components/app-field/AppInputField.vue'
import AppAutoCompleteField from '~/common/components/app-field/AppAutoCompleteField.vue'
import { useAppTableStore } from '~/common/components/app-table/stores/AppTableStore'
import { tableHeader } from '~/features/customers'
import CustomerCreate from '~/features/customers/components/CustomerCreate.vue'
import CustomerEdit from '~/features/customers/components/CustomerEdit.vue'
import { useCustomerStore } from '~/features/customers/store'
import type { CustomerFilters } from '~/features/customers/types'

definePageMeta({ title: 'Customers' })

const store = useCustomerStore()
const appTableStore = useAppTableStore()

const items = computed(() => store.items || [])
const isLoading = computed(() => store.isLoading)

const filters = computed<CustomerFilters>({
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
  store.filters = { pageNumber: 1, pageSize: 20, search: null, userId: null, isActive: null }
})
</script>

<template>
  <div>
    <AppCrud
      title="Customers"
      add-text="Add Customer"
      :add-action="() => store.setCreateDialog(true)"
      :total-pages="store.totalPages"
      @update:current-page="filters.pageNumber = $event"
    >
      <template #filters>
        <AppInputField v-model="filters.search" placeholder="Search customers..." />
      </template>

      <AppTable title="Customers" :headers="tableHeader()" :items="items" :is-loading="isLoading">
        <template #data-name="{ item }">
          <span class="font-medium">{{ item.name }}</span>
        </template>

        <template #data-email="{ item }">
          <span class="text-gray-600">{{ item.email || '-' }}</span>
        </template>

        <template #data-phone="{ item }">
          <span class="text-gray-600">{{ item.phone || '-' }}</span>
        </template>

        <template #data-address="{ item }">
          <span class="text-gray-600">{{ item.address || '-' }}</span>
        </template>

        <template #data-user="{ item }">
          <span class="font-medium">{{ item.user?.fullName || '-' }}</span>
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
                store.setItem(item)
                store.setEditDialog(true)
              }
            "
            :delete-service="(id: string) => store.remove(id)"
          />
        </template>
      </AppTable>
    </AppCrud>

    <CustomerCreate />
    <CustomerEdit />
  </div>
</template>
