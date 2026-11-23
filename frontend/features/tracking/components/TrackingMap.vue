<script setup lang="ts">
import { useTrackingStore } from '../store'
import { useAuthStore } from '~/features/auth/store/auth'
import { useCollapse } from '~/common/layers/tairo-layout-collapse/composables/collapse'
import type { UserLocation } from '../types'
import L, {
  Map as LeafletMap,
  Marker,
  Circle,
  CircleMarker,
  DivIcon,
  type LatLngExpression,
  type Layer,
} from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.locatecontrol/dist/L.Control.Locate.css'
import { LocateControl } from 'leaflet.locatecontrol'

const trackingStore = useTrackingStore()
const authStore = useAuthStore()
const { isOpen, isMobileOpen } = useCollapse()

// Helper to get user initials
const getUserInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const mapContainer = ref<HTMLDivElement | null>(null)
const map = ref<LeafletMap | null>(null)
const userMarkers = ref<Map<string, Marker>>(new Map())
const accuracyCircles = ref<Map<string, Circle>>(new Map())
const currentUserCircleMarker = ref<Marker | null>(null)
const currentUserAccuracyCircle = ref<Circle | null>(null)

// Function to create current user icon with dynamic initials
const createCurrentUserIcon = (initials: string) =>
  new DivIcon({
    className: 'custom-user-marker',
    html: `
    <div style="width: 48px; height: 48px; position: relative;">
      <!-- Outer glow pulse -->
      <div style="position: absolute; inset: 0; background: #3B82F6; border-radius: 50%; border: 4px solid rgba(255,255,255,0.8); box-shadow: 0 0 20px rgba(59,130,246,0.6); animation: pulse 2s infinite;"></div>
      <!-- Middle ring -->
      <div style="position: absolute; inset: 0; background: #3B82F6; border-radius: 50%; border: 2px solid rgba(255,255,255,0.9);"></div>
      <!-- Inner circle with user initial -->
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background: #2563EB; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 10px; font-weight: bold; line-height: 1;">${initials}</span>
      </div>
      <!-- White center dot -->
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
    </div>
  `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  })

const otherUserIcon = new DivIcon({
  className: 'custom-other-user-marker',
  html: `
    <div style="width: 32px; height: 32px; position: relative;">
      <div style="position: absolute; inset: 0; background: #10B981; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>
      <div style="position: absolute; inset: 0; background: #10B981; border-radius: 50%; border: 2px solid white;"></div>
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const customerIcon = new DivIcon({
  className: 'custom-customer-marker',
  html: `
    <div style="width: 32px; height: 32px; position: relative;">
      <div style="position: absolute; inset: 0; background: #F59E0B; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>
      <div style="position: absolute; inset: 0; background: #F59E0B; border-radius: 50%; border: 2px solid white;"></div>
      <svg style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 16px; height: 16px; color: white;" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.072V17h2.928l-.793-.793 8.586-8.586-.793-.793z" />
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const initMap = () => {
  if (!mapContainer.value) return

  console.log('[TrackingMap] Initializing map, container:', mapContainer.value)
  console.log(
    '[TrackingMap] Container dimensions:',
    mapContainer.value.clientWidth,
    'x',
    mapContainer.value.clientHeight
  )

  // Ensure container has dimensions - SET EXPLICIT HEIGHT to avoid layout issues
  mapContainer.value.style.height = 'calc(100vh - 120px)'
  mapContainer.value.style.minHeight = '500px'
  mapContainer.value.style.width = '100%'
  mapContainer.value.style.zIndex = '10'
  mapContainer.value.style.position = 'relative'

  // Force a reflow to ensure dimensions are calculated
  mapContainer.value.offsetHeight

  console.log(
    '[TrackingMap] Container dimensions after explicit height:',
    mapContainer.value.clientWidth,
    'x',
    mapContainer.value.clientHeight
  )

  // Initialize map
  const mapConfig = trackingStore.mapConfig
  map.value = L.map(mapContainer.value, {
    center: mapConfig.center,
    zoom: mapConfig.zoom,
    maxZoom: mapConfig.maxZoom,
    minZoom: mapConfig.minZoom,
    zoomControl: true,
    attributionControl: true,
  })

  console.log('[TrackingMap] Map initialized:', map.value)

  // Force map to update size after initialization - multiple attempts for delayed layouts
  const invalidateAttempts = [0, 100, 500, 1000, 2000]
  invalidateAttempts.forEach((delay) => {
    setTimeout(() => {
      if (map.value) {
        console.log(`[TrackingMap] Calling invalidateSize at ${delay}ms`)
        map.value.invalidateSize()
      }
    }, delay)
  })

  // Add tile layer (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map.value! as L.Map)

  // Add locate control
  const locateControl = new LocateControl({
    position: 'topright',
    strings: {
      title: 'Show me where I am',
    },
    locateOptions: {
      enableHighAccuracy: true,
    },
  })
  locateControl.addTo(map.value! as L.Map)

  // Force map to invalidate size after a short delay to ensure container is rendered
  setTimeout(() => {
    if (map.value) {
      map.value.invalidateSize()
    }
  }, 100)

  // Watch for map config changes
  watch(
    () => trackingStore.mapConfig,
    (newConfig) => {
      if (map.value && newConfig.center) {
        map.value.setView(newConfig.center, newConfig.zoom, { animate: true })
      }
    },
    { deep: true }
  )

  // Update markers when userLocations change
  watch(
    () => trackingStore.userLocations,
    (locations) => {
      updateMarkers(locations)
    },
    { deep: true }
  )

  // Update current user location marker
  let hasCenteredOnUser = false
  watch(
    () => trackingStore.currentLocation,
    (location) => {
      updateCurrentUserMarker(location)
      // Auto-center on current user when first location is received
      if (location && !hasCenteredOnUser && map.value) {
        hasCenteredOnUser = true
        map.value.setView([location.latitude, location.longitude], trackingStore.mapConfig.zoom, {
          animate: true,
        })
      }
    },
    { deep: true }
  )
}

const updateMarkers = (locations: UserLocation[]) => {
  console.log('[TrackingMap] updateMarkers called with', locations.length, 'locations:', locations)
  if (!map.value) {
    console.warn('[TrackingMap] updateMarkers: map not initialized yet')
    return
  }

  // Remove markers for users no longer in the list
  const currentUserIds = new Set(locations.map((l) => l.userId))

  userMarkers.value.forEach((marker, userId) => {
    if (!currentUserIds.has(userId)) {
      map.value?.removeLayer(marker as any)
      userMarkers.value.delete(userId)
    }
  })

  // Remove accuracy circles for users no longer in the list
  accuracyCircles.value.forEach((circle, userId) => {
    if (!currentUserIds.has(userId)) {
      map.value?.removeLayer(circle as any)
      accuracyCircles.value.delete(userId)
    }
  })

  // Add/update markers for each location
  locations.forEach((location) => {
    const isCurrentUser = location.userId === authStore.userData?.id

    if (isCurrentUser) {
      updateCurrentUserMarker(location)
      return
    }

    // Create or update marker
    let marker = userMarkers.value.get(location.userId)
    const position: LatLngExpression = [location.latitude, location.longitude]

    if (!marker) {
      const icon = location.customerId ? customerIcon : otherUserIcon
      marker = L.marker(position, { icon })
      marker.addTo(map.value! as LeafletMap)
      userMarkers.value.set(location.userId, marker)
    } else {
      marker.setLatLng(position)
    }

    // Bind popup with user info
    marker.bindPopup(`
      <div class="p-2 min-w-[200px]">
        <h3 class="font-semibold text-gray-900">${location.userName}</h3>
        <p class="text-sm text-gray-600 mt-1">Lat: ${location.latitude.toFixed(6)}, Lng: ${location.longitude.toFixed(6)}</p>
        <p class="text-sm text-gray-600">Accuracy: ${location.accuracy?.toFixed(1) || 'N/A'}m</p>
        <p class="text-sm text-gray-600">Speed: ${location.speed?.toFixed(1) || 'N/A'} m/s</p>
        <p class="text-sm text-gray-600">Updated: ${new Date(location.timestamp).toLocaleTimeString()}</p>
        ${location.customerId ? `<p class="text-sm text-amber-600 mt-1">At customer location</p>` : ''}
      </div>
    `)

    // Update accuracy circle
    if (location.accuracy && location.accuracy > 0) {
      let circle = accuracyCircles.value.get(location.userId)
      if (!circle) {
        circle = L.circle(position, {
          radius: location.accuracy,
          color: location.customerId ? '#F59E0B' : '#10B981',
          fillColor: location.customerId ? '#F59E0B' : '#10B981',
          fillOpacity: 0.15,
          weight: 1,
        })
        circle.addTo(map.value! as LeafletMap)
        accuracyCircles.value.set(location.userId, circle)
      } else {
        circle.setLatLng(position)
        circle.setRadius(location.accuracy)
      }
    } else {
      // Remove accuracy circle if no accuracy
      const circle = accuracyCircles.value.get(location.userId)
      if (circle) {
        map.value?.removeLayer(circle as any)
        accuracyCircles.value.delete(location.userId)
      }
    }
  })
}

const updateCurrentUserMarker = (location: UserLocation | null) => {
  console.log('[TrackingMap] updateCurrentUserMarker called with:', location)
  if (!map.value || !location) {
    console.warn('[TrackingMap] updateCurrentUserMarker: map or location missing', {
      map: !!map.value,
      location,
    })
    return
  }

  const position: LatLngExpression = [location.latitude, location.longitude]

  // Get user initials for the marker
  const initials = getUserInitials(authStore.userData?.fullName || 'You')
  console.log('[TrackingMap] User initials:', initials)

  // Update or create enhanced marker for current user
  if (!currentUserCircleMarker.value) {
    currentUserCircleMarker.value = L.marker(position, {
      icon: createCurrentUserIcon(initials),
      zIndexOffset: 1000, // Keep on top
    })
    currentUserCircleMarker.value.addTo(map.value as LeafletMap)
  } else {
    currentUserCircleMarker.value.setLatLng(position)
    // Update the icon with current initials in case name changed
    currentUserCircleMarker.value.setIcon(createCurrentUserIcon(initials))
  }

  // Update accuracy circle for current user
  if (location.accuracy && location.accuracy > 0) {
    if (!currentUserAccuracyCircle.value) {
      currentUserAccuracyCircle.value = L.circle(position, {
        radius: location.accuracy,
        color: '#3B82F6',
        fillColor: '#3B82F6',
        fillOpacity: 0.15,
        weight: 2,
      })
      currentUserAccuracyCircle.value.addTo(map.value as LeafletMap)
    } else {
      currentUserAccuracyCircle.value.setLatLng(position)
      currentUserAccuracyCircle.value.setRadius(location.accuracy)
    }
  } else if (currentUserAccuracyCircle.value) {
    map.value.removeLayer(currentUserAccuracyCircle.value as unknown as Layer)
    currentUserAccuracyCircle.value = null
  }

  // Center map on current user if following
  if (
    map.value &&
    trackingStore.mapConfig.center[0] === location.latitude &&
    trackingStore.mapConfig.center[1] === location.longitude
  ) {
    // Map is already centered
  }
}

const centerOnCurrentUser = () => {
  if (!map.value) return

  const currentUserId = authStore.userData?.id

  // First try: use currentLocation (set when current user sends location)
  if (trackingStore.currentLocation && trackingStore.currentLocation.userId === currentUserId) {
    map.value.setView(
      [trackingStore.currentLocation.latitude, trackingStore.currentLocation.longitude],
      trackingStore.mapConfig.zoom,
      { animate: true }
    )
    return
  }

  // Second try: find current user in userLocations (for admin/viewer who are also tracked)
  if (currentUserId) {
    const currentUserLocation = trackingStore.userLocations.find(
      (loc) => loc.userId === currentUserId
    )
    if (currentUserLocation) {
      map.value.setView(
        [currentUserLocation.latitude, currentUserLocation.longitude],
        trackingStore.mapConfig.zoom,
        { animate: true }
      )
      return
    }
  }

  // Fallback: use map's configured center
  map.value.setView(trackingStore.mapConfig.center, trackingStore.mapConfig.zoom, {
    animate: true,
  })
}

const centerOnUser = (userId: string) => {
  const user = trackingStore.userLocations.find((u) => u.userId === userId)
  if (map.value && user) {
    map.value.setView([user.latitude, user.longitude], 15, { animate: true })
  }
}

const toggleLayer = (layer: 'satellite' | 'streets') => {
  if (!map.value) return

  // Remove existing tile layers
  map.value.eachLayer((layer: any) => {
    if (layer instanceof L.TileLayer) {
      map.value?.removeLayer(layer)
    }
  })

  if (layer === 'satellite') {
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19,
      }
    ).addTo(map.value! as LeafletMap)
  } else {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map.value! as LeafletMap)
  }
}

// Initialize map on mount
onMounted(async () => {
  // Wait for DOM to be ready and layout to settle
  await nextTick()
  // Additional tick to ensure parent layout has computed heights
  await nextTick()
  initMap()

  // Watch for sidebar collapse/expand (both desktop and mobile) to invalidate map size
  watch([isOpen, isMobileOpen], () => {
    // Use nextTick to ensure DOM has updated before invalidating
    nextTick(() => {
      if (map.value) {
        map.value.invalidateSize()
      }
    })
  })
})
</script>

<template>
  <div class="my-2 flex h-16 flex-row gap-2">
    <div class="flex flex-row items-center gap-2">
      <BaseButton
        size="sm"
        @click="centerOnCurrentUser"
        class="shadow-lg"
        title="Center on my location"
      >
        <Icon name="ph:navigation-arrow-duotone" class="size-4" />
      </BaseButton>
      <BaseButton
        size="sm"
        @click="toggleLayer('satellite')"
        class="shadow-lg"
        title="Satellite view"
      >
        <Icon name="lets-icons:map" class="size-4" />
      </BaseButton>
      <BaseButton size="sm" @click="toggleLayer('streets')" class="shadow-lg" title="Street view">
        <Icon name="carbon:map-boundary-vegetation" class="size-4" />
      </BaseButton>
    </div>
    <!-- Connection status -->

    <!-- Horizontal User Bar (top center) -->
    <div class="flex-1 -translate-x-1/2" v-if="trackingStore.userLocations.length > 0">
      <div
        class="scrollbar-hide flex max-w-[90vw] items-center gap-2 overflow-x-auto rounded-xl bg-white/95 px-3 py-2 shadow-xl"
      >
        <span class="hidden whitespace-nowrap text-xs font-medium text-gray-500 sm:block">
          Online:
        </span>
        <template v-for="user in trackingStore.userLocations" :key="user.userId">
          <button
            type="button"
            class="flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            :class="[
              'group',
              user.userId === authStore.userData?.id
                ? 'bg-blue-50 ring-2 ring-blue-500'
                : 'bg-gray-50 hover:bg-gray-100',
            ]"
            @click="centerOnUser(user.userId)"
            :title="user.userName"
            :aria-label="`Center on ${user.userName}`"
          >
            <icon name="hugeicons:user-account" size="25" class="leading-non font-bold">
              {{ getUserInitials(user.userName) }}
            </icon>
            <div class="relative">
              <!-- Status indicator dot -->
              <div
                class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white"
                :class="user.customerId ? 'bg-amber-500' : 'bg-green-500'"
              />
            </div>
            <span
              class="max-w-[80px] truncate text-xs font-medium text-gray-700 transition-all duration-200 group-hover:max-w-[120px]"
            >
              {{ user.userName }}
            </span>
          </button>
        </template>
      </div>
    </div>
  </div>

  <!-- User list panel (admin/viewer) -->
  <div class="max-h-96 w-64" v-if="['admin', 'viewer'].includes(authStore.userData?.role || '')">
    <div class="overflow-hidden rounded-lg bg-white/95 shadow-lg">
      <div class="flex items-center justify-between border-b px-3 py-2">
        <h4 class="font-semibold text-gray-900">Online Users</h4>
        <span class="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
          {{ trackingStore.userLocations.length }}
        </span>
      </div>
      <div class="max-h-72 overflow-y-auto">
        <div
          v-for="user in trackingStore.userLocations"
          :key="user.userId"
          class="flex cursor-pointer items-center justify-between border-b px-3 py-2 hover:bg-gray-50"
          @click="centerOnUser(user.userId)"
        >
          <div class="flex items-center gap-2">
            <div
              class="h-2 w-2 rounded-full"
              :class="user.customerId ? 'bg-amber-500' : 'bg-green-500'"
            />
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-gray-900">{{ user.userName }}</p>
              <p class="text-xs text-gray-500">
                {{ user.accuracy?.toFixed(1) || 'N/A' }}m · {{ user.speed?.toFixed(1) || '0' }} m/s
              </p>
            </div>
          </div>
          <BaseButton size="sm" variant="outline" @click.stop="centerOnUser(user.userId)">
            <Icon name="ph:map-pin-duotone" class="size-4" />
          </BaseButton>
        </div>
      </div>
    </div>
  </div>

  <div class="relative h-full w-full flex-1" ref="mapContainer" />
</template>

<style scoped>
.leaflet-container {
  height: 100%;
  width: 100%;
  font-family: inherit;
}

.leaflet-popup-content-wrapper {
  border-radius: 8px;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.leaflet-popup-content {
  margin: 0;
}

.custom-user-marker,
.custom-other-user-marker,
.custom-customer-marker {
  pointer-events: none;
}

/* Pulse animation for user marker */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

/* Hide scrollbar for horizontal user bar */
.scrollbar-hide {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
.scrollbar-hide::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}
</style>
