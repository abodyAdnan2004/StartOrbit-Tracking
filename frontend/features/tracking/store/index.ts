import { locationService } from '../service'
import { useAuthStore } from '~/features/auth/store'
import type { LocationDto, LocationFilters, UserLocation, TrackingCustomer, MapConfig } from '../types'
import { ref, computed, onMounted, onUnmounted } from 'vue'

export const useTrackingStore = defineStore('tracking', () => {
  const authStore = useAuthStore()

  // Current user's location
  const currentLocation = ref<UserLocation | null>(null)

  // All online users' locations
  const userLocations = ref<UserLocation[]>([])

  // Location history
  const locationHistory = ref<LocationDto[]>([])
  const historyLoading = ref(false)
  const historyTotalPages = ref(0)

  // Customers for tracking
  const customers = ref<TrackingCustomer[]>([])
  const customersLoading = ref(false)

  // Distance stats
  const distanceStats = ref<{
    totalDistanceMeters: number
    totalDistanceKm: string
    estimatedSteps: number
    locationCount: number
  } | null>(null)

  // Filters
  const filters = ref<LocationFilters>({
    pageNumber: 1,
    pageSize: 50,
    userId: null,
    customerId: null,
    startDate: null,
    endDate: null,
  })

  // Map configuration
  const mapConfig = ref<MapConfig>({
    center: [40.7128, -74.0060] as [number, number], // Default to NYC
    zoom: 13,
    maxZoom: 19,
    minZoom: 2,
  })

  // Socket connection
  let socket: WebSocket | null = null
  const isConnected = ref(false)

  // Initialize socket connection
  const initSocket = () => {
    if (!authStore.token) return

    const wsUrl = `ws://localhost:3000`
    socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      console.log('Socket connected')
      isConnected.value = true
      // Authenticate
      socket?.send(JSON.stringify({ type: 'authenticate', token: authStore.token }))
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleSocketMessage(data)
      } catch (error) {
        console.error('Socket message parse error:', error)
      }
    }

    socket.onclose = () => {
      console.log('Socket disconnected')
      isConnected.value = false
      // Reconnect after 5 seconds
      setTimeout(initSocket, 5000)
    }

    socket.onerror = (error) => {
      console.error('Socket error:', error)
    }
  }

  const handleSocketMessage = (data: any) => {
    switch (data.type) {
      case 'auth:success':
        console.log('Socket authenticated')
        break
      case 'location:update':
        updateUserLocation(data)
        break
      case 'user:online':
        console.log('User online:', data)
        break
      case 'user:offline':
        console.log('User offline:', data)
        removeUserLocation(data.userId)
        break
    }
  }

  const updateUserLocation = (data: UserLocation) => {
    // Update current user's location
    if (data.userId === authStore.user?.id) {
      currentLocation.value = data
      // Update map center
      mapConfig.value.center = [data.latitude, data.longitude]
    }

    // Update user locations list
    const index = userLocations.value.findIndex(u => u.userId === data.userId)
    if (index >= 0) {
      userLocations.value[index] = data
    } else {
      userLocations.value.push(data)
    }
  }

  const removeUserLocation = (userId: number) => {
    userLocations.value = userLocations.value.filter(u => u.userId !== userId)
  }

  // Fetch current user's customers
  const loadCustomers = async () => {
    if (!authStore.user?.id) return
    try {
      customersLoading.value = true
      customers.value = await locationService.getCustomers(authStore.user.id)
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      customersLoading.value = false
    }
  }

  // Load location history
  const loadHistory = async (page = 1) => {
    if (!authStore.user?.id) return
    try {
      historyLoading.value = true
      filters.value.pageNumber = page
      const response = await locationService.getByUser(authStore.user.id, filters.value)
      if (page === 1) {
        locationHistory.value = response.items
      } else {
        locationHistory.value = [...locationHistory.value, ...response.items]
      }
      historyTotalPages.value = response.calculatedTotalPages
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      historyLoading.value = false
    }
  }

  // Load distance stats
  const loadDistanceStats = async (startDate?: string, endDate?: string) => {
    if (!authStore.user?.id) return
    try {
      distanceStats.value = await locationService.getDistanceStats(
        authStore.user.id,
        startDate,
        endDate
      )
    } catch (error) {
      console.error('Failed to load distance stats:', error)
    }
  }

  // Load latest locations for all users (for admin/manager)
  const loadLatestLocations = async () => {
    try {
      const response = await locationService.getLatest()
      userLocations.value = response.items
    } catch (error) {
      console.error('Failed to load latest locations:', error)
    }
  }

  onMounted(() => {
    if (authStore.token) {
      initSocket()
      if (authStore.user?.role === 'admin' || authStore.user?.role === 'manager') {
        loadLatestLocations()
      } else {
        loadCustomers()
        loadDistanceStats()
      }
    }
  })

  onUnmounted(() => {
    if (socket) {
      socket.close()
      socket = null
    }
  })

  return {
    // State
    currentLocation,
    userLocations,
    locationHistory,
    historyLoading,
    historyTotalPages,
    customers,
    customersLoading,
    distanceStats,
    filters,
    mapConfig,
    isConnected,
    // Actions
    initSocket,
    loadCustomers,
    loadHistory,
    loadDistanceStats,
    loadLatestLocations,
  }
})