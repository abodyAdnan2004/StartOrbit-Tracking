import type { BaseFilters } from '~/common/utils/types/ApiResponses'
import type { BaseDto } from '~/common/utils/types/base-dto'

// Customer DTO (what the API returns)
export interface CustomerDto extends BaseDto {
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  status: 'pending' | 'approved' | 'cancelled'
  statusTimestamps: {
    pending: string
    approved?: string
    cancelled?: string
  }
  isActive: boolean
  user: {
    id: string
    fullName: string
    username: string  // Keep for filter, not display
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
  longitude?: number | null
  latitude?: number | null
  status?: 'pending' | 'approved' | 'cancelled'
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
  longitude?: number | null
  latitude?: number | null
  status?: 'pending' | 'approved' | 'cancelled'
}

// Filters for listing customers
export interface CustomerFilters extends BaseFilters {
  search: string | null
  userId?: string | null
  userFullName?: string | null        // NEW
  userUsername?: string | null        // NEW
  isActive?: boolean | null
  status?: 'pending' | 'approved' | 'cancelled' | null
  fromDate?: string | null
  toDate?: string | null
}