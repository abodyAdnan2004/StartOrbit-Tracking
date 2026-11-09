import type { BaseFilters } from '~/common/utils/types/ApiResponses'
import type { BaseDto } from '~/common/utils/types/base-dto'

// Location point DTO
export interface LocationDto extends BaseDto {
  id: string
  userId: string
  user?: {
    id: string
    fullName: string
    username: string
  }
  customerId?: string
  customer?: {
    id: string
    name: string
  }
  latitude: number
  longitude: number
  altitude?: number | null
  accuracy?: number | null
  speed?: number | null
  heading?: number | null
  timestamp: string
  metadata?: Record<string, unknown>
}

// Customer for tracking
export interface TrackingCustomer {
  id: string
  name: string
  latitude?: number | null
  longitude?: number | null
  address?: string | null
}

// User location for real-time tracking
export interface UserLocation {
  userId: string
  userName: string
  latitude: number
  longitude: number
  accuracy?: number | null
  speed?: number | null
  heading?: number | null
  timestamp: string
  customerId?: string | null
}

// Filters for location history
export interface LocationFilters extends BaseFilters {
  userId?: string | null
  customerId?: string | null
  startDate?: string | null
  endDate?: string | null
}

// Map configuration
export interface MapConfig {
  center: [number, number]
  zoom: number
  maxZoom: number
  minZoom: number
}
