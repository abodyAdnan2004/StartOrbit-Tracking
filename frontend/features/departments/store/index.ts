import { DepartmentService } from '../service'
import type { Department, DepartmentDto, DepartmentFilters, DepartmentUpdateDto } from '../types'

const departmentService = new DepartmentService()

export const useDepartmentStore = defineStore('department', () => {
  const departments = ref<DepartmentDto[]>([])
  const isLoading = ref(false)
  const filters = ref<DepartmentFilters>({
    pageSize: 10,
    pageNumber: 1,
    name: null,
    code: null,
    managerId: null,
    parentDepartmentId: null,
    topLevelOnly: false,
    includeSubDepartments: false,
    includeManager: true,
    includeParent: true,
    minBudget: null,
    maxBudget: null,
  })
  const isCreateDialogOpen = ref(false)
  const isEditDialogOpen = ref(false)
  const selectedDepartmentId = ref<number | null>(null)
  const selectedDepartment = ref<DepartmentDto | null>(null)
  const totalPages = ref(0)
  const hierarchyData = ref<DepartmentDto[]>([])

  const getDepartments = async () => {
    try {
      isLoading.value = true
      const response = await departmentService.get(filters.value)
      departments.value = response.items
      totalPages.value = response.calculatedTotalPages
    } catch (error) {
      console.error('Error fetching departments:', error)
    } finally {
      isLoading.value = false
    }
  }
  const getDepartmentById = async (id: number, includeSubDepartments?: boolean) => {
    try {
      isLoading.value = true
      const department = await departmentService.getById(id, includeSubDepartments)
      return department
    } catch (error) {
      console.error('Error fetching department by ID:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const getDepartmentHierarchy = async () => {
    try {
      isLoading.value = true
      const hierarchy = await departmentService.getHierarchy()
      hierarchyData.value = hierarchy
      return hierarchy
    } catch (error) {
      console.error('Error fetching department hierarchy:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const getTopLevelDepartments = async (departmentFilters: DepartmentFilters) => {
    try {
      isLoading.value = true
      const response = await departmentService.getTopLevel(departmentFilters)
      departments.value = response.items
      totalPages.value = response.calculatedTotalPages
    } catch (error) {
      console.error('Error fetching top-level departments:', error)
    } finally {
      isLoading.value = false
    }
  }

  const getDepartmentsWithBudget = async (departmentFilters: DepartmentFilters) => {
    try {
      isLoading.value = true
      const response = await departmentService.getWithBudget(departmentFilters)
      departments.value = response.items
      totalPages.value = response.calculatedTotalPages
    } catch (error) {
      console.error('Error fetching departments with budget:', error)
    } finally {
      isLoading.value = false
    }
  }

  const createDepartment = async (data: Department) => {
    try {
      isLoading.value = true
      await departmentService.create(data)
      await getDepartments()
    } catch (error) {
      console.error('Error creating department:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const updateDepartment = async (data: DepartmentUpdateDto) => {
    try {
      isLoading.value = true
      await departmentService.update(selectedDepartmentId.value!, data)
      await getDepartments()
    } catch (error) {
      console.error('Error updating department:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const deleteDepartment = async (id: number) => {
    try {
      isLoading.value = true
      await departmentService.delete(id)
      await getDepartments()
    } catch (error) {
      console.error('Error deleting department:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const setSelectedDepartment = (department: DepartmentDto) => {
    selectedDepartment.value = department
    selectedDepartmentId.value = department.id
  }

  return {
    departments,
    isLoading,
    filters,
    getDepartments,
    getDepartmentById,
    getDepartmentHierarchy,
    getTopLevelDepartments,
    getDepartmentsWithBudget,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    isCreateDialogOpen,
    isEditDialogOpen,
    selectedDepartmentId,
    selectedDepartment,
    setSelectedDepartment,
    totalPages,
    hierarchyData,
  }
})
