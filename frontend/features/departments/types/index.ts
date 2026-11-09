import type { BaseFilters } from '~/common/utils/types/ApiResponses'
import type { BaseDto } from '~/common/utils/types/base-dto'

export type Manager = {
  id: number
  fullName: string
  email: string
  username: string
}

export type Department = {
  name: string
  description?: string | null
  code: string
  managerId?: number | null
  parentDepartmentId?: number | null
  budget?: number | null
  location?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
}

export type DepartmentDto = Omit<BaseDto, 'id'> & {
  id: number
  name: string
  description?: string | null
  code: string
  managerId?: number | null
  manager?: Manager | null
  parentDepartmentId?: number | null
  parentDepartment?: DepartmentDto | null
  subDepartments?: DepartmentDto[]
  budget?: number | null
  location?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export type DepartmentCreateDto = Department

export type DepartmentUpdateDto = Department & {
  id: number | string
}

export type DepartmentFilters = BaseFilters & {
  name?: string | null
  code?: string | null
  managerId?: number | null
  parentDepartmentId?: number | null
  topLevelOnly?: boolean
  includeSubDepartments?: boolean
  includeManager?: boolean
  includeParent?: boolean
  minBudget?: number | null
  maxBudget?: number | null
}
