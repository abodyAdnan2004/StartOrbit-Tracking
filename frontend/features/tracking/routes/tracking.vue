<script setup lang="ts">
import TrackingMap from '~/features/tracking/components/TrackingMap.vue'
import { useTrackingStore } from '~/features/tracking/store'

definePageMeta({ title: 'Live Tracking' })

const trackingStore = useTrackingStore()
const authStore = useAuthStore()

onMounted(() => {
  // Initialize tracking store
  if (authStore.token) {
    if (authStore.userData.role === 'admin') {
      trackingStore.loadLatestLocations()
    } else {
      trackingStore.loadCustomers()
      trackingStore.loadDistanceStats()
    }
  }
})

onUnmounted(() => {
  // Cleanup if needed
})
</script>

<template>
  <div class="flex h-screen flex-col bg-gray-50">
    <!-- Header -->
    <header class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <div class="flex items-center gap-3">
        <Icon name="ph:radar-duotone" class="size-6 text-primary-600" />
        <h1 class="text-xl font-semibold text-gray-900">Live Tracking</h1>
      </div>
      <div class="flex items-center gap-4">
        <!-- Connection status -->
        <div class="flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5">
          <span
            class="h-2 w-2 rounded-full"
            :class="trackingStore.isConnected ? 'animate-pulse bg-green-500' : 'bg-red-500'"
          />
          <span class="text-sm font-medium text-gray-700">
            {{ trackingStore.isConnected ? 'Live' : 'Offline' }}
          </span>
        </div>
        <!-- User info -->
        <div class="flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
            <Icon name="ph:user-duotone" class="size-4 text-primary-600" />
          </div>
          <span class="hidden text-sm font-medium text-gray-700 sm:block">
            {{ authStore.userData.fullName }}
          </span>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="relative flex min-h-0 flex-1">
      <TrackingMap />
    </main>
  </div>
</template>
