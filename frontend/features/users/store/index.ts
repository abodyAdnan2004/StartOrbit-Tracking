import { userService } from '../service'
import type { UserDto, UserCreateDto, UserUpdateDto, UserFilters, ChangePasswordDto } from '../types'
import { useToast } from '~/common/composables/toaster'

export const useUserStore = defineStore('users', () => {
  const items = ref<UserDto[]>([])
  const isLoading = ref(false)
  const totalPages = ref(0)
  const totalItems = ref(0)

  const filters = ref<UserFilters>({
    pageNumber: 1,
    pageSize: 20,
    search: null,
    roleId: null,
    isActive: null,
  })

  const isCreateDialogOpen = ref(false)
  const isEditDialogOpen = ref(false)
  const isChangePasswordDialogOpen = ref(false)
  const selectedItemId = ref<number | null>(null)
  const selectedItem = ref<UserDto | null>(null)

  const getAll = async () => {
    try {
      isLoading.value = true
      const response = await userService.get(filters.value)
      items.value = response.items
      totalPages.value = response.calculatedTotalPages
      totalItems.value = response.totalItems
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      isLoading.value = false
    }
  }

  const create = async (data: UserCreateDto) => {
    try {
      isLoading.value = true
      await userService.create(data)
      await getAll()
      useToast({ title: 'User created successfully', isError: false })
    } catch (error) {
      console.error('Failed to create user:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const update = async (data: UserUpdateDto) => {
    try {
      isLoading.value = true
      await userService.update(selectedItemId.value!, data)
      await getAll()
      useToast({ title: 'User updated successfully', isError: false })
    } catch (error) {
      console.error('Failed to update user:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const remove = async (id: number) => {
    try {
      isLoading.value = true
      await userService.delete(id)
      await getAll()
      useToast({ title: 'User deleted successfully', isError: false })
    } catch (error) {
      console.error('Failed to delete user:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const changePassword = async (data: ChangePasswordDto) => {
    try {
      isLoading.value = true
      await userService.changePassword(selectedItemId.value!, data)
      isChangePasswordDialogOpen.value = false
      useToast({ title: 'Password changed successfully', isError: false })
    } catch (error) {
      console.error('Failed to change password:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const setSelected = (item: UserDto) => {
    selectedItem.value = item
    selectedItemId.value = item.id
  }

  const openChangePasswordDialog = (item: UserDto) => {
    selectedItem.value = item
    selectedItemId.value = item.id
    isChangePasswordDialogOpen.value = true
  }

  return {
    items,
    isLoading,
    totalPages,
    totalItems,
    filters,
    isCreateDialogOpen,
    isEditDialogOpen,
    isChangePasswordDialogOpen,
    selectedItemId,
    selectedItem,
    getAll,
    create,
    update,
    remove,
    changePassword,
    setSelected,
    openChangePasswordDialog,
  }
})