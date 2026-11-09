<script setup lang="ts">
import { useTrackingStore } from '../store'
import type { UserLocation, MapConfig } from '../types'
import L, {
  Map as LeafletMap,
  TileLayer,
  Marker,
  Circle,
  CircleMarker,
  Icon,
  DivIcon,
  type LatLngExpression,
  type Layer,
  type LayerGroup,
} from 'leaflet'
import 'leaflet/dist/leaflet.css'

const trackingStore = useTrackingStore()
const authStore = useAuthStore()
const userLocations = computed(() => trackingStore.userLocations)
const mapContainer = ref<HTMLDivElement | null>(null)
const map = ref<LeafletMap | null>(null)
const userMarkers = ref<Map<number, Marker>>(new Map())
const accuracyCircles = ref<Map<number, Circle>>(new Map())
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
    center: trackingStore.mapConfig.value.center,
    zoom: trackingStore.mapConfig.value.zoom,
    maxZoom: trackingStore.mapConfig.value.maxZoom,
    minZoom: trackingStore.mapConfig.value.minZoom,
    zoomControl: true,
    attributionControl: true,
  })

  // Add tile layer (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map.value! as LeafletMap)

  // Add locate control
  // @ts-ignore - leaflet.locatecontrol not in types
  const locateControl = L.control.locate({
    position: 'topright',
    strings: {
      title: 'Show me where I am',
    },
    locateOptions: {
      enableHighAccuracy: true,
    },
  })
  // @ts-ignore - locate control addTo type mismatch
  locateControl.addTo(map.value!)

  // Watch for map config changes
  watch(
    () => trackingStore.mapConfig,
    (newConfig) => {
      if (map.value && newConfig.value.center) {
        map.value.setView(newConfig.value.center, newConfig.value.zoom, { animate: true })
      }
    },
    { deep: true }
  )

  // Update markers when userLocations change
  watch(
    () => userLocations.value.value,
    (locations) => {
      updateMarkers(locations)
    },
    { deep: true }
  )

  // Update current user location marker
  watch(
    () => trackingStore.currentLocation.value,
    (location) => {
      updateCurrentUserMarker(location)
    },
    { deep: true }
  )
}

const updateMarkers = (locations: UserLocation[]) => {
  if (!map.value) return

  // Remove markers for users no longer in the list
  const currentUserIds = new Set(locations.map((l) => l.userId))

  userMarkers.value.forEach((marker, userId) => {
    // @ts-ignore - locate control addTo type mismatch
    if (!currentUserIds.has(userId)) {
      // @ts-ignore - locate control addTo type mismatch
      map.value?.removeLayer(marker)
      userMarkers.value.delete(userId)
    }
  })

  // Remove accuracy circles for users no longer in the list
  accuracyCircles.value.forEach((circle, userId) => {
    // @ts-ignore - locate control addTo type mismatch

    if (!currentUserIds.has(userId)) {
      // @ts-ignore - locate control addTo type mismatch

      map.value?.removeLayer(circle)
      accuracyCircles.value.delete(userId)
    }
  })

  // Add/update markers for each location
  locations.forEach((location) => {
    const isCurrentUser = location.userId === authStore.userData.value?.id

    if (isCurrentUser) {
      updateCurrentUserMarker(location)
      return
    }

    // @ts-ignore - locate control addTo type mismatch
    // Create or update marker
    let marker = userMarkers.value.get(location.userId)
    const position: LatLngExpression = [location.latitude, location.longitude]

    if (!marker) {
      const icon = location.customerId ? customerIcon : otherUserIcon
      marker = L.marker(position, { icon })
      marker.addTo(map.value! as LeafletMap)
      // @ts-ignore - locate control addTo type mismatch

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
      // @ts-ignore - locate control addTo type mismatch

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
        // @ts-ignore - locate control addTo type mismatch

        accuracyCircles.value.set(location.userId, circle)
      } else {
        circle.setLatLng(position)
        circle.setRadius(location.accuracy)
      }
    } else {
      // Remove accuracy circle if no accuracy
      // @ts-ignore - locate control addTo type mismatch

      const circle = accuracyCircles.value.get(location.userId)
      if (circle) {
        // @ts-ignore - locate control addTo type mismatch

        map.value?.removeLayer(circle)
        // @ts-ignore - locate control addTo type mismatch

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
    currentUserCircleMarker.value.addTo(map.value as LeafletMap)

    // Add pulsing outer circle
    const pulseCircle = L.circleMarker(position, {
      radius: 20,
      color: '#3B82F6',
      fillColor: '#3B82F6',
      fillOpacity: 0.3,
      weight: 2,
      opacity: 0.5,
    })
    pulseCircle.addTo(map.value as LeafletMap)

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
    trackingStore.mapConfig.value.center[0] === location.latitude &&
    trackingStore.mapConfig.value.center[1] === location.longitude
  ) {
    // Map is already centered
  }
}

const centerOnCurrentUser = () => {
  if (map.value && trackingStore.currentLocation.value) {
    map.value.setView(
      [trackingStore.currentLocation.value.latitude, trackingStore.currentLocation.value.longitude],
      trackingStore.mapConfig.value.zoom,
      { animate: true }
    )
  }
}

const centerOnUser = (userId: string) => {
  const user = userLocations.value.value.find((u) => u.userId === userId)
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
</script>

<template>
  <div class="relative h-full w-full" ref="mapContainer">
    <!-- Map controls -->
    <div class="absolute left-4 top-4 z-10 flex flex-col gap-2">
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
      <BaseButton size="sm" @click="toggleLayer('streets')" class="shadow-lg" title="Street view">
        <Icon name="ph:map-duotone" class="size-4" />
      </BaseButton>
    </div>

    <!-- Connection status -->
    <div class="absolute right-4 top-4 z-10 flex items-center gap-2">
      <div class="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 shadow-lg">
        <span
          class="h-2 w-2 rounded-full"
          :class="trackingStore.isConnected ? 'bg-green-500' : 'bg-red-500'"
        />
        <span class="text-xs text-gray-700">
          {{ trackingStore.isConnected ? 'Live' : 'Offline' }}
        </span>
      </div>
    </div>

    <!-- Current user info -->
    <div class="absolute bottom-4 left-4 z-10 max-w-xs">
      <div class="rounded-lg bg-white/95 p-3 shadow-lg">
        <div class="mb-2 flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
            <Icon name="ph:user-duotone" class="size-4 text-white" />
          </div>
          <div>
            <p class="font-semibold text-gray-900">
              {{ authStore.userData.value?.fullName || 'You' }}
            </p>
            <p class="text-xs text-gray-500">Tracking active</p>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="rounded bg-gray-50 p-2">
            <p class="text-xs text-gray-500">Accuracy</p>
            <p class="font-mono text-sm font-semibold">
              {{ trackingStore.currentLocation.value?.accuracy?.toFixed(1) || 'N/A' }}m
            </p>
          </div>
          <div class="rounded bg-gray-50 p-2">
            <p class="text-xs text-gray-500">Speed</p>
            <p class="font-mono text-sm font-semibold">
              {{ trackingStore.currentLocation.value?.speed?.toFixed(1) || '0' }} m/s
            </p>
          </div>
          <div class="rounded bg-gray-50 p-2">
            <p class="text-xs text-gray-500">Heading</p>
            <p class="font-mono text-sm font-semibold">
              {{ trackingStore.currentLocation.value?.heading?.toFixed(0) || '0' }}°
            </p>
          </div>
        </div>
        <div class="mt-2 text-center text-xs text-gray-500">
          Updated:
          {{
            trackingStore.currentLocation.value
              ? new Date(trackingStore.currentLocation.value.timestamp).toLocaleTimeString()
              : '--'
          }}
        </div>
      </div>
    </div>

    <!-- User list panel (admin/manager) -->
    <div
      class="absolute bottom-4 right-4 z-10 max-h-96 w-64"
      v-if="
        authStore.userData.value?.role === 'admin' || authStore.userData.value?.role === 'manager'
      "
    >
      <div class="overflow-hidden rounded-lg bg-white/95 shadow-lg">
        <div class="flex items-center justify-between border-b px-3 py-2">
          <h4 class="font-semibold text-gray-900">Online Users</h4>
          <span class="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
            {{ userLocations.value.length }}
          </span>
        </div>
        <div class="max-h-72 overflow-y-auto">
          <div
            v-for="user in userLocations.value"
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
                  {{ user.accuracy?.toFixed(1) || 'N/A' }}m ·
                  {{ user.speed?.toFixed(1) || '0' }} m/s
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

    <!-- Legend -->
    <div
      class="absolute bottom-4 left-4 z-10"
      v-if="
        !(
          authStore.userData.value?.role === 'admin' || authStore.userData.value?.role === 'manager'
        )
      "
    >
      <div class="flex flex-col gap-2 rounded-lg bg-white/95 p-3 shadow-lg">
        <div class="flex items-center gap-2">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-500 shadow-md"
          >
            <div class="h-3 w-3 rounded-full bg-white"></div>
          </div>
          <span class="text-sm text-gray-700">Your Location</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative h-8 w-8">
            <div
              class="border-3 absolute inset-0 rounded-full border-white bg-green-500 shadow-lg"
            ></div>
            <div class="absolute inset-0 rounded-full border-2 border-white bg-green-500"></div>
          </div>
          <span class="text-sm text-gray-700">Other Users</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative h-8 w-8">
            <div
              class="border-3 absolute inset-0 rounded-full border-white bg-amber-500 shadow-lg"
            ></div>
            <div class="absolute inset-0 rounded-full border-2 border-white bg-amber-500"></div>
            <svg
              class="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.072V17h2.928l-.793.793 8.586-8.586-.793-.793z"
              />
            </svg>
          </div>
          <span class="text-sm text-gray-700">Customer Location</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="h-6 w-6 rounded-full border-2 border-blue-500 bg-blue-500/20"></div>
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
</style>
