import { locationService } from '../service'
import type {
  LocationDto,
  LocationFilters,
  UserLocation,
  TrackingCustomer,
  MapConfig,
} from '../types'
import { io, Socket } from 'socket.io-client'

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
      center: [33.3128, 44.3615] as [number, number], // Default to NYC
      zoom: 13,
      maxZoom: 19,
      minZoom: 2,
    })

  // Socket connection
  let socket: Socket | null = null
  const isConnected = ref(false)

  // Initialize socket connection
  const initSocket = () => {
    if (!authStore.token) return

    const wsUrl = `http://localhost:3000`
    socket = io(wsUrl, {
      auth: {
        token: authStore.token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 5000,
      reconnectionAttempts: Infinity,
    })

    socket.on('connect', () => {
      console.log('Socket connected')
      isConnected.value = true
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      isConnected.value = false
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    socket.on('auth:success', () => {
      console.log('Socket authenticated')
    })

    socket.on('location:update', (data: UserLocation) => {
      updateUserLocation(data)
    })

    socket.on('user:online', (data) => {
      console.log('User online:', data)
    })

    socket.on('user:offline', (data) => {
      console.log('User offline:', data)
      removeUserLocation(data.userId)
    })
  }

  const updateUserLocation = (data: UserLocation) => {
    // Update current user's location
    if (data.userId === authStore.userData.id) {
      currentLocation.value = data
      // Update map center
      mapConfig.value.center = [data.latitude, data.longitude]
    }

    // Update user locations list
    const index = userLocations.value.findIndex((u) => u.userId === data.userId)
    if (index >= 0) {
      userLocations.value[index] = data
    } else {
      userLocations.value.push(data)
    }
  }

  const removeUserLocation = (userId: string) => {
    userLocations.value = userLocations.value.filter((u) => u.userId !== userId)
  }

  // Fetch current user's customers
  const loadCustomers = async () => {
    if (!authStore.userData.id) return
    try {
      customersLoading.value = true
      customers.value = await locationService.getCustomers(authStore.userData.id)
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      customersLoading.value = false
    }
  }

  // Load location history
  const loadHistory = async (page = 1) => {
    if (!authStore.userData.id) return
    try {
      historyLoading.value = true
      filters.value.pageNumber = page
      const response = await locationService.getByUser(authStore.userData.id, filters.value)
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
    if (!authStore.userData.id) return
    try {
      distanceStats.value = await locationService.getDistanceStats(
        authStore.userData.id,
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
      if (authStore.userData.role === 'admin') {
        loadLatestLocations()
      } else {
        loadCustomers()
        loadDistanceStats()
      }
    }
  })

  onUnmounted(() => {
    if (socket) {
      socket.disconnect()
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
