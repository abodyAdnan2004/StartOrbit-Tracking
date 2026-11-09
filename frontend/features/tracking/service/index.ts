import axios from '~/common/services/app-client/axios'
import type { PaginatedResponse } from '~/common/utils/types/ApiResponses'
import type { LocationDto, LocationFilters, UserLocation, TrackingCustomer } from '../types'

interface ILocationService {
  get: (filters: LocationFilters) => Promise<PaginatedResponse<LocationDto>>
  getLatest: () => Promise<{ items: UserLocation[] }>
  getByUser: (userId: number, filters: LocationFilters) => Promise<PaginatedResponse<LocationDto>>
  getDistanceStats: (userId: number, startDate?: string, endDate?: string) => Promise<{
    userId: number
    totalDistanceMeters: number
    totalDistanceKm: string
    estimatedSteps: number
    locationCount: number
    period: { start: string | null; end: string | null }
  }>
  getCustomers: (userId: number) => Promise<TrackingCustomer[]>
}

export class LocationService implements ILocationService {
  async get(filters: LocationFilters): Promise<PaginatedResponse<LocationDto>> {
    const response = await axios.get<PaginatedResponse<LocationDto>>('/locations', {
      params: filters,
    })
    return response.data
  }

  async getLatest(): Promise<{ items: UserLocation[] }> {
    const response = await axios.get<{ items: UserLocation[] }>('/locations/latest')
    return response.data
  }

  async getByUser(userId: number, filters: LocationFilters): Promise<PaginatedResponse<LocationDto>> {
    const response = await axios.get<PaginatedResponse<LocationDto>>(`/locations/user/${userId}`, {
      params: filters,
    })
    return response.data
  }

  async getDistanceStats(userId: number, startDate?: string, endDate?: string): Promise<{
    userId: number
    totalDistanceMeters: number
    totalDistanceKm: string
    estimatedSteps: number
    locationCount: number
    period: { start: string | null; end: string | null }
  }> {
    const params: Record<string, string> = {}
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate

    const response = await axios.get(`/locations/stats/distance/${userId}`, { params })
    return response.data
  }

  async getCustomers(userId: number): Promise<TrackingCustomer[]> {
    const response = await axios.get<TrackingCustomer[]>(`/users/${userId}/customers`)
    return response.data
  }
}

export const locationService = new LocationService()