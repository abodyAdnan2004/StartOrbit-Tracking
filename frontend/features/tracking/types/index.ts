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

// Map configuration
export interface MapConfig {
  center: [number, number]
  zoom: number
  maxZoom: number
  minZoom: number
}
