import { useAuthStore } from '~/features/auth/store/auth'
import { io, Socket } from 'socket.io-client'
import type { MapConfig, UserLocation } from '../types'

export const useTrackingStore = defineStore('tracking', () => {
  const authStore = useAuthStore()

  // All online users' locations (real-time only)
  const userLocations = ref<UserLocation[]>([])
  const isConnected = ref(false)
  // Current user's own location (for users with 'user' role)
  const currentLocation = ref<UserLocation | null>(null)
  // Map configuration
  const mapConfig = reactive<MapConfig>({
    center: [33.3128, 44.3615] as [number, number],
    zoom: 13,
    maxZoom: 19,
    minZoom: 2,
  })
  let socket: Socket | null = null
  let isInitialized = false

  // Socket initialization
  const initSocket = () => {
    // Prevent multiple initializations
    if (isInitialized && socket?.connected) {
      console.log('Socket already initialized and connected')
      return
    }

    const wsUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000'
    console.log('Initializing socket connection to:', wsUrl)

    socket = io(wsUrl, {
      auth: { token: authStore.token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    })
    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id)
      isConnected.value = true
      isInitialized = true

      console.log('online-users emited')
      socket?.emit('get:online-users')
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      isConnected.value = false
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message)
      isConnected.value = false
    })

    socket.on('location:backend-frontend', (data: UserLocation) => {
      try {
        console.log('Received location update from backend:', data.userId, data.userName)
        console.log('Received location:', data)
        if (data.userId === authStore.userData?.id) {
          currentLocation.value = data
        }
        updateUserLocation(data)
      } catch (error) {
        console.log(error)
      }
    })

    socket.on('user:offline', (data) => {
      console.log('User went offline:', data.userId)
      removeUserLocation(data.userId)
    })

    socket.on('users:online', (users: UserLocation[]) => {
      console.log('Received online users:', users.length)
      users.forEach((u) => updateUserLocation(u))
    })

    socket.on('auth:success', (data) => {
      console.log('Socket authenticated:', data)
    })

    socket.on('auth:error', (data) => {
      console.error('Socket auth error:', data)
      // Token might be expired - try to refresh or logout
      // Note: refreshAccessToken might not exist on authStore, using logout as fallback
      try {
        if (typeof authStore.refreshAccessToken === 'function') {
          authStore.refreshAccessToken().catch(() => {
            authStore.logout()
          })
        } else {
          authStore.logout()
        }
      } catch {
        authStore.logout()
      }
    })
  }

  const updateUserLocation = (data: UserLocation) => {
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

  // Initialize socket for all authenticated users (not just admin/viewer)
  // Admin/viewer will see all users, regular users will see their own location
  onMounted(() => {
    if (authStore.token) {
      initSocket()
    }
  })

  onUnmounted(() => {
    socket?.disconnect()
    socket = null
    isInitialized = false
  })

  return { userLocations, isConnected, initSocket, currentLocation, mapConfig }
})
