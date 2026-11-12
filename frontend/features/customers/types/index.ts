import type { BaseFilters } from '~/common/utils/types/ApiResponses'
import type { BaseDto } from '~/common/utils/types/base-dto'

// Customer DTO (what the API returns)
export interface CustomerDto extends BaseDto {
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  isActive: boolean
  userId: string
  user: {
    id: string
    fullName: string
    username: string
  }
}

// Create payload
export interface CustomerCreateDto {
  name: string
  email?: string
  phone: string | null
  address: string | null
  notes?: string | null
  userId: string | null
}

// Update payload
export interface CustomerUpdateDto {
  id: string | null
  name: string
  email?: string | null
  phone: string | null
  address: string | null
  notes?: string | null
  isActive?: boolean
  userId: string | null
}

// Filters for listing customers
export interface CustomerFilters extends BaseFilters {
  search: string | null
  userId?: string | null
  isActive?: boolean | null
}
