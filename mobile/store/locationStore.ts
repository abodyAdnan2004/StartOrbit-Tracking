import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './authStore';
import { api } from '@/utils/api';
import { Location as LocationType } from '@/types/location';

interface LocationState {
  // Current location
  currentLocation: LocationType | null;
  lastUpdate: Date | null;

  // Tracking state
  isTracking: boolean;
  selectedCustomerId: number | null;
  trackingInterval: NodeJS.Timeout | null;

  // Offline queue
  locationQueue: LocationType[];
  queueLength: number;
  isOnline: boolean;

  // Error
  error: string | null;

  // Actions
  startTracking: (token: string, customerId?: number) => Promise<void>;
  stopTracking: () => void;
  sendLocation: (location: LocationType) => Promise<void>;
  flushQueue: () => Promise<void>;
  setOnlineStatus: (online: boolean) => void;
  clearError: () => void;
}

let socket: Socket | null = null;
let watchId: number | null = null;
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  lastUpdate: null,
  isTracking: false,
  selectedCustomerId: null,
  trackingInterval: null,
  locationQueue: [],
  queueLength: 0,
  isOnline: true,
  error: null,

  startTracking: async (token: string, customerId?: number) => {
    try {
      // Initialize socket connection
      if (!socket || !socket.connected) {
        socket = io(API_BASE_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
          console.log('Socket connected');
          set({ isOnline: true, error: null });
        });

        socket.on('disconnect', () => {
          console.log('Socket disconnected');
          set({ isOnline: false });
        });

        socket.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          set({ error: 'Connection failed', isOnline: false });
        });

        socket.on('auth:success', () => {
          console.log('Socket authenticated');
        });

        socket.on('auth:error', (data) => {
          console.error('Socket auth error:', data);
          set({ error: data.message });
        });
      }

      // Request location permissions
      const { Location } = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      // Start watching location
      watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 15000, // 15 seconds
          distanceInterval: 10, // 10 meters
        },
        (location) => {
          const locationData: LocationType = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude ?? undefined,
            accuracy: location.coords.accuracy ?? undefined,
            speed: location.coords.speed ?? undefined,
            heading: location.coords.heading ?? undefined,
            timestamp: new Date(location.timestamp),
            customerId: get().selectedCustomerId,
            metadata: {
              source: 'mobile',
              battery: 100, // Would need expo-battery for real value
            },
          };

          get().sendLocation(locationData);
        }
      );

      // Also set up background task for background tracking
      // This requires TaskManager setup in app config

      set({
        isTracking: true,
        selectedCustomerId: customerId || null,
        error: null,
      });

      console.log('Tracking started', customerId ? `for customer ${customerId}` : 'without customer');
    } catch (error: any) {
      set({ error: error.message || 'Failed to start tracking' });
      throw error;
    }
  },

  stopTracking: () => {
    // Stop location watching
    if (watchId) {
      Location.clearWatchAsync(watchId);
      watchId = null;
    }

    // Clear tracking interval
    const { trackingInterval } = get();
    if (trackingInterval) {
      clearInterval(trackingInterval);
    }

    // Disconnect socket
    if (socket) {
      socket.disconnect();
      socket = null;
    }

    set({
      isTracking: false,
      selectedCustomerId: null,
      trackingInterval: null,
    });

    console.log('Tracking stopped');
  },

  sendLocation: async (location: LocationType) => {
    set({ lastUpdate: new Date(), currentLocation: location });

    // Update current location for map
    set(state => ({
      currentLocation: location,
    }));

    // Try to send via socket first (real-time)
    if (socket && socket.connected) {
      socket.emit('location:update', location);
    }

    // Also send via REST API for persistence
    try {
      await api.post('/locations', location);
    } catch (error) {
      // If offline, queue for later
      if (!get().isOnline) {
        set(state => ({
          locationQueue: [...state.locationQueue, location],
          queueLength: state.locationQueue.length + 1,
        }));
      }
    }
  },

  flushQueue: async () => {
    const { locationQueue, isOnline } = get();
    if (!isOnline || locationQueue.length === 0) return;

    try {
      // Send queued locations in batch
      await api.post('/locations', locationQueue);
      set({ locationQueue: [], queueLength: 0 });
    } catch (error) {
      console.error('Failed to flush queue:', error);
    }
  },

  setOnlineStatus: (online: boolean) => {
    set({ isOnline: online });
    if (online) {
      get().flushQueue();
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Initialize socket on auth
export const initializeSocket = (token: string) => {
  const { isTracking } = useLocationStore.getState();
  if (isTracking) return; // Already initialized

  // Socket will be created when startTracking is called
};

// Cleanup on app background/foreground
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

// Background location task
TaskManager.defineTask('background-location-task', async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    const store = useLocationStore.getState();

    for (const location of locations) {
      const locationData: LocationType = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude ?? undefined,
        accuracy: location.coords.accuracy ?? undefined,
        speed: location.coords.speed ?? undefined,
        heading: location.coords.heading ?? undefined,
        timestamp: new Date(location.timestamp),
        customerId: store.selectedCustomerId,
        metadata: { source: 'background' },
      };

      store.sendLocation(locationData);
    }
  }
});

import { Location } from 'expo-location';