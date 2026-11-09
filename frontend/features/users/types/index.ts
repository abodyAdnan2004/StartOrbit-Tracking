import type { BaseFilters } from '~/common/utils/types/ApiResponses'
import type { BaseDto } from '~/common/utils/types/base-dto'

// User roles
export interface Role {
  id: string
  name: string
  description: string | null
  isSystemRole: boolean
  isActive: boolean
}

// User DTO (what the API returns)
export interface UserDto extends BaseDto {
  employeeId: number
  username: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  phoneNumber: string | null
  role: Role
  isActive: boolean
}

// Create payload
export interface UserCreateDto {
  employeeId: number
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string | null
  role: string | null
  isActive?: boolean
}

// Update payload
export interface UserUpdateDto {
  id: string | null
  username?: string
  email?: string
  firstName?: string
  lastName?: string
  phoneNumber?: string | null
  role: string | null
  isActive?: boolean
}

// Change password payload
export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Filters for listing users
export interface UserFilters extends BaseFilters {
  search: string | null
  role?: string | null
  isActive?: boolean | null
}
