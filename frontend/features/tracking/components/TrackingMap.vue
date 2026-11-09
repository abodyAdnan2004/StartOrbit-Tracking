<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, computed } from 'vue'
import { useTrackingStore } from '../store'
import type { UserLocation, MapConfig } from '../types'
import L, { Map, TileLayer, Marker, Circle, CircleMarker, Icon, DivIcon, LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'

const trackingStore = useTrackingStore()

const mapContainer = ref<HTMLDivElement | null>(null)
const map = ref<Map | null>(null)
const userMarkers = ref<Map<number, Marker>>({})
const accuracyCircles = ref<Map<number, Circle>>({})
const currentUserCircleMarker = ref<CircleMarker | null>(null)
const currentUserAccuracyCircle = ref<Circle | null>(null)

// Custom marker icons
const currentUserIcon = new DivIcon({
  className: 'custom-user-marker',
  html: `
    <div class="relative w-10 h-10">
      <div class="absolute inset-0 bg-blue-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
      <div class="absolute inset-0 bg-blue-500 rounded-full border-2 border-white"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
})

const otherUserIcon = new DivIcon({
  className: 'custom-other-user-marker',
  html: `
    <div class="relative w-8 h-8">
      <div class="absolute inset-0 bg-green-500 rounded-full border-3 border-white shadow-lg"></div>
      <div class="absolute inset-0 bg-green-500 rounded-full border-2 border-white"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const customerIcon = new DivIcon({
  className: 'custom-customer-marker',
  html: `
    <div class="relative w-8 h-8">
      <div class="absolute inset-0 bg-amber-500 rounded-full border-3 border-white shadow-lg"></div>
      <div class="absolute inset-0 bg-amber-500 rounded-full border-2 border-white"></div>
      <svg class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.072V17h2.928l-.793.793 8.586-8.586-.793-.793z" />
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const initMap = () => {
  if (!mapContainer.value) return

  // Initialize map
  map.value = L.map(mapContainer.value, {
    center: trackingStore.mapConfig.center,
    zoom: trackingStore.mapConfig.zoom,
    maxZoom: trackingStore.mapConfig.maxZoom,
    minZoom: trackingStore.mapConfig.minZoom,
    zoomControl: true,
    attributionControl: true,
  })

  // Add tile layer (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map.value)

  // Add locate control
  L.control.locate({
    position: 'topright',
    strings: {
      title: 'Show me where I am',
    },
    locateOptions: {
      enableHighAccuracy: true,
    },
  }).addTo(map.value)

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
  watch(
    () => trackingStore.currentLocation,
    (location) => {
      updateCurrentUserMarker(location)
    },
    { deep: true }
  )
}

const updateMarkers = (locations: UserLocation[]) => {
  if (!map.value) return

  // Remove markers for users no longer in the list
  const currentUserIds = new Set(locations.map(l => l.userId))
  userMarkers.value.forEach((marker, userId) => {
    if (!currentUserIds.has(userId)) {
      map.value?.removeLayer(marker)
      userMarkers.value.delete(userId)
    }
  })

  // Remove accuracy circles for users no longer in the list
  accuracyCircles.value.forEach((circle, userId) => {
    if (!currentUserIds.has(userId)) {
      map.value?.removeLayer(circle)
      accuracyCircles.value.delete(userId)
    }
  })

  // Add/update markers for each location
  locations.forEach(location => {
    const isCurrentUser = location.userId === useAuthStore().user?.id

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
      marker.addTo(map.value!)
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
        circle.addTo(map.value!)
        accuracyCircles.value.set(location.userId, circle)
      } else {
        circle.setLatLng(position)
        circle.setRadius(location.accuracy)
      }
    } else {
      // Remove accuracy circle if no accuracy
      const circle = accuracyCircles.value.get(location.userId)
      if (circle) {
        map.value?.removeLayer(circle)
        accuracyCircles.value.delete(location.userId)
      }
    }
  })
}

const updateCurrentUserMarker = (location: UserLocation | null) => {
  if (!map.value || !location) return

  const position: LatLngExpression = [location.latitude, location.longitude]

  // Update or create circle marker for current user
  if (!currentUserCircleMarker.value) {
    currentUserCircleMarker.value = L.circleMarker(position, {
      radius: 12,
      color: '#3B82F6',
      fillColor: '#3B82F6',
      fillOpacity: 1,
      weight: 3,
      opacity: 1,
    })
    currentUserCircleMarker.value.addTo(map.value)

    // Add pulsing outer circle
    const pulseCircle = L.circleMarker(position, {
      radius: 20,
      color: '#3B82F6',
      fillColor: '#3B82F6',
      fillOpacity: 0.3,
      weight: 2,
      opacity: 0.5,
    })
    pulseCircle.addTo(map.value)

    // Animate pulse
    let radius = 20
    const animate = () => {
      if (!currentUserCircleMarker.value) return
      radius = radius >= 30 ? 20 : radius + 0.5
      pulseCircle.setRadius(radius)
      requestAnimationFrame(animate)
    }
    animate()
  } else {
    currentUserCircleMarker.value.setLatLng(position)
  }

  // Update accuracy circle for current user
  if (location.accuracy && location.accuracy > 0) {
    if (!currentUserAccuracyCircle.value) {
      currentUserAccuracyCircle.value = L.circle(position, {
        radius: location.accuracy,
        color: '#3B82F6',
        fillColor: '#3B82F6',
        fillOpacity: 0.15,
        weight: 1,
      })
      currentUserAccuracyCircle.value.addTo(map.value)
    } else {
      currentUserAccuracyCircle.value.setLatLng(position)
      currentUserAccuracyCircle.value.setRadius(location.accuracy)
    }
  } else if (currentUserAccuracyCircle.value) {
    map.value.removeLayer(currentUserAccuracyCircle.value)
    currentUserAccuracyCircle.value = null
  }

  // Center map on current user if following
  if (map.value && trackingStore.mapConfig.center[0] === location.latitude && trackingStore.mapConfig.center[1] === location.longitude) {
    // Map is already centered
  }
}

const centerOnCurrentUser = () => {
  if (map.value && trackingStore.currentLocation) {
    map.value.setView(
      [trackingStore.currentLocation.latitude, trackingStore.currentLocation.longitude],
      trackingStore.mapConfig.zoom,
      { animate: true }
    )
  }
}

const centerOnUser = (userId: number) => {
  const user = trackingStore.userLocations.find(u => u.userId === userId)
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
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19,
    }).addTo(map.value!)
  } else {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map.value!)
  }
}

const useAuthStore = () => import('~/features/auth/store').then(m => m.useAuthStore())
</script>

<template>
  <div class="relative w-full h-full" ref="mapContainer">
    <!-- Map controls -->
    <div class="absolute top-4 left-4 z-10 flex flex-col gap-2">
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
        <Icon name="ph:map-pin-line-duotone" class="size-4" />
      </BaseButton>
      <BaseButton
        size="sm"
        @click="toggleLayer('streets')"
        class="shadow-lg"
        title="Street view"
      >
        <Icon name="ph:map-duotone" class="size-4" />
      </BaseButton>
    </div>

    <!-- Connection status -->
    <div class="absolute top-4 right-4 z-10 flex items-center gap-2">
      <div class="flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 shadow-lg">
        <span
          class="w-2 h-2 rounded-full"
          :class="trackingStore.isConnected ? 'bg-green-500' : 'bg-red-500'"
        />
        <span class="text-xs text-gray-700">
          {{ trackingStore.isConnected ? 'Live' : 'Offline' }}
        </span>
      </div>
    </div>

    <!-- Current user info -->
    <div class="absolute bottom-4 left-4 z-10 max-w-xs">
      <div class="bg-white/95 rounded-lg shadow-lg p-3">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <Icon name="ph:user-duotone" class="size-4 text-white" />
          </div>
          <div>
            <p class="font-semibold text-gray-900">{{ useAuthStore().user?.fullName || 'You' }}</p>
            <p class="text-xs text-gray-500">Tracking active</p>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="p-2 bg-gray-50 rounded">
            <p class="text-xs text-gray-500">Accuracy</p>
            <p class="font-mono text-sm font-semibold">
              {{ trackingStore.currentLocation?.accuracy?.toFixed(1) || 'N/A' }}m
            </p>
          </div>
          <div class="p-2 bg-gray-50 rounded">
            <p class="text-xs text-gray-500">Speed</p>
            <p class="font-mono text-sm font-semibold">
              {{ trackingStore.currentLocation?.speed?.toFixed(1) || '0' }} m/s
            </p>
          </div>
          <div class="p-2 bg-gray-50 rounded">
            <p class="text-xs text-gray-500">Heading</p>
            <p class="font-mono text-sm font-semibold">
              {{ trackingStore.currentLocation?.heading?.toFixed(0) || '0' }}°
            </p>
          </div>
        </div>
        <div class="mt-2 text-xs text-gray-500 text-center">
          Updated: {{ trackingStore.currentLocation ? new Date(trackingStore.currentLocation.timestamp).toLocaleTimeString() : '--' }}
        </div>
      </div>
    </div>

    <!-- User list panel (admin/manager) -->
    <div class="absolute bottom-4 right-4 z-10 max-h-96 w-64" v-if="useAuthStore().user?.role === 'admin' || useAuthStore().user?.role === 'manager'">
      <div class="bg-white/95 rounded-lg shadow-lg overflow-hidden">
        <div class="px-3 py-2 border-b flex items-center justify-between">
          <h4 class="font-semibold text-gray-900">Online Users</h4>
          <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
            {{ trackingStore.userLocations.length }}
          </span>
        </div>
        <div class="max-h-72 overflow-y-auto">
          <div
            v-for="user in trackingStore.userLocations"
            :key="user.userId"
            class="px-3 py-2 border-b hover:bg-gray-50 cursor-pointer flex items-center justify-between"
            @click="centerOnUser(user.userId)"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-2 h-2 rounded-full"
                :class="user.customerId ? 'bg-amber-500' : 'bg-green-500'"
              />
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ user.userName }}</p>
                <p class="text-xs text-gray-500">
                  {{ user.accuracy?.toFixed(1) || 'N/A' }}m · {{ user.speed?.toFixed(1) || '0' }} m/s
                </p>
              </div>
            </div>
            <BaseButton size="xs" variant="ghost" @click.stop="centerOnUser(user.userId)">
              <Icon name="ph:map-pin-duotone" class="size-4" />
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="absolute bottom-4 left-4 z-10" v-if="!((useAuthStore().user?.role === 'admin') || (useAuthStore().user?.role === 'manager'))">
      <div class="bg-white/95 rounded-lg shadow-lg p-3 flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white shadow-md">
            <div class="w-3 h-3 bg-white rounded-full"></div>
          </div>
          <span class="text-sm text-gray-700">Your Location</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative w-8 h-8">
            <div class="absolute inset-0 bg-green-500 rounded-full border-3 border-white shadow-lg"></div>
            <div class="absolute inset-0 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <span class="text-sm text-gray-700">Other Users</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative w-8 h-8">
            <div class="absolute inset-0 bg-amber-500 rounded-full border-3 border-white shadow-lg"></div>
            <div class="absolute inset-0 bg-amber-500 rounded-full border-2 border-white"></div>
            <svg class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.072V17h2.928l-.793.793 8.586-8.586-.793-.793z" />
            </svg>
          </div>
          <span class="text-sm text-gray-700">Customer Location</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full border-2 border-blue-500 bg-blue-500/20"></div>
          <span class="text-sm text-gray-700">Accuracy Radius</span>
        </div>
      </div>
    </div>

    <div ref="mapContainer" class="absolute inset-0" />
  </div>
</template>

<style scoped>
.leaflet-container {
  height: 100%;
  width: 100%;
  font-family: inherit;
}

.leaflet-popup-content-wrapper {
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.leaflet-popup-content {
  margin: 0;
}

.custom-user-marker,
.custom-other-user-marker,
.custom-customer-marker {
  pointer-events: none;
}
</style>