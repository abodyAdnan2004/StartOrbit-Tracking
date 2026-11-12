import { customerService } from '../service'
import type { CustomerDto, CustomerCreateDto, CustomerUpdateDto, CustomerFilters } from '../types'
import { useToast } from '~/common/composables/toaster'

export const useCustomerStore = defineStore('customers', () => {
  const items = ref<CustomerDto[]>([])
  const item = ref<CustomerDto | null>(null)
  const isLoading = ref(false)
  const totalPages = ref(0)
  const totalItems = ref(0)

  const filters = ref<CustomerFilters>({
    pageNumber: 1,
    pageSize: 20,
    search: null,
    userId: null,
    isActive: null,
  })

  const isCreateDialogOpen = ref<boolean>(false)
  const isEditDialogOpen = ref<boolean>(false)

  const setCreateDialog = (val: boolean) => {
    isCreateDialogOpen.value = val
  }
  const setEditDialog = (val: boolean) => {
    isEditDialogOpen.value = val
  }

  const getAll = async () => {
    try {
      isLoading.value = true
      const response = await customerService.get(filters.value)
      items.value = response.items
      totalPages.value = response.calculatedTotalPages
      totalItems.value = response.totalItems
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    } finally {
      isLoading.value = false
    }
  }

  const create = async (data: CustomerCreateDto) => {
    try {
      isLoading.value = true
      await customerService.create(data)
      await getAll()
      useToast({ title: 'Customer created successfully', isError: false })
    } catch (error) {
      console.error('Failed to create customer:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const update = async (data: CustomerUpdateDto) => {
    try {
      isLoading.value = true
      if (!item.value?.id) return
      await customerService.update(item.value?.id!, data)
      await getAll()
      useToast({ title: 'Customer updated successfully', isError: false })
    } catch (error) {
      console.error('Failed to update customer:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const remove = async (id: string) => {
    try {
      isLoading.value = true
      await customerService.delete(id)
      await getAll()
      useToast({ title: 'Customer deleted successfully', isError: false })
    } catch (error) {
      console.error('Failed to delete customer:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const setItem = (_item: CustomerDto) => {
    item.value = _item
  }

  return {
    items,
    isLoading,
    totalPages,
    totalItems,
    filters,
    isCreateDialogOpen,
    isEditDialogOpen,
    item,
    getAll,
    create,
    update,
    remove,
    setItem,
    setCreateDialog,
    setEditDialog,
  }
})
