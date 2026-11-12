import { create } from "zustand";
import { initializeSocket, disconnectSocket, getSocket, setSocketCallbacks } from "@/utils/socket";
import * as location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface LocationType {
	id: string;
	userId: string;
	latitude: number;
	longitude: number;
	altitude?: number;
	accuracy?: number;
	speed?: number;
	heading?: number;
	timestamp: Date;
	customerId?: string | null;
	metadata?: Record<string, unknown>;
}

const OFFLINE_QUEUE_KEY = '@offline_location_queue';
const MAX_QUEUE_SIZE = 100; // Limit queue size to prevent memory issues

interface LocationState {
	// Current location
	currentLocation: LocationType | null;
	lastUpdate: Date | null;

	// Tracking state
	isTracking: boolean;
	isConnected: boolean;

	// Offline queue
	offlineQueue: LocationType[];
	isFlushQueue: boolean;

	// Error
	error: string | null;

	// Actions
	startTracking: (token: string) => Promise<void>;
	stopTracking: () => void;
	sendLocation: (location: LocationType) => Promise<void>;
	setOnlineStatus: (online: boolean) => void;
	clearError: () => void;
	flushOfflineQueue: () => Promise<void>;
	loadOfflineQueue: () => Promise<void>;
	queueLocation: (locationData: LocationType) => Promise<void>;
}

let watchId: location.LocationSubscription | null = null;

// Set up socket callbacks once when store is created
setSocketCallbacks({
	onConnect: () => {
		useLocationStore.getState().setOnlineStatus(true);
		// Flush offline queue when connection is restored
		useLocationStore.getState().flushOfflineQueue();
	},
	onDisconnect: () => {
		useLocationStore.getState().setOnlineStatus(false);
	},
	onConnectError: () => {
		useLocationStore.getState().setOnlineStatus(false);
	},
	onAuthError: async () => {
		// Token might be expired, the auth store will handle refresh/logout
		console.log('Socket auth error - token may be expired');
	},
});

export const useLocationStore = create<LocationState>((set, get) => ({
	currentLocation: null,
	lastUpdate: null,
	isTracking: false,
	isConnected: false,
	offlineQueue: [],
	isFlushQueue: false,
	error: null,

	startTracking: async (token: string) => {
		try {
			// Load any persisted offline queue
			await get().loadOfflineQueue();

			// Initialize socket connection using shared utility
			// Permissions are already checked by the tracking screen
			initializeSocket(token);

			// Start watching location (permissions assumed granted by caller)
			watchId = await location.watchPositionAsync(
				{
					accuracy: location.Accuracy.High,
					timeInterval: 15000, // 15 seconds
					distanceInterval: 10, // 10 meters
				},
				(_location: location.LocationObject) => {
					const socket = getSocket();
					const locationData: LocationType = {
						id: _location.coords.latitude.toString() + _location.coords.longitude.toString() + Date.now().toString(),
						userId: "",
						latitude: _location.coords.latitude,
						longitude: _location.coords.longitude,
						altitude: _location.coords.altitude ?? undefined,
						accuracy: _location.coords.accuracy ?? undefined,
						speed: _location.coords.speed ?? undefined,
						heading: _location.coords.heading ?? undefined,
						timestamp: new Date(_location.timestamp),
						metadata: {
							source: "mobile",
						},
					};

					get().sendLocation(locationData);
				},
			);

			set({
				isTracking: true,
				error: null,
			});

			console.log("Tracking started");
		} catch (error: any) {
			set({ error: error.message || "Failed to start tracking" });
			throw error;
		}
	},

	stopTracking: () => {
		// Stop location watching
		if (watchId) {
			watchId.remove();
			watchId = null;
		}

		// Disconnect socket using shared utility
		disconnectSocket();

		set({
			isTracking: false,
			isConnected: false,
		});

		console.log("Tracking stopped");
	},

	sendLocation: async (locationData: LocationType) => {
		set({ lastUpdate: new Date(), currentLocation: locationData });

		// Try to send via socket (real-time only)
		const socket = getSocket();
		if (socket && socket.connected) {
			socket.emit("location:update", locationData);
		} else {
			// Queue for later if offline
			await get().queueLocation(locationData);
		}
	},

	// Add location to offline queue
	queueLocation: async (locationData: LocationType) => {
		const { offlineQueue } = get();
		const newQueue = [...offlineQueue, locationData].slice(-MAX_QUEUE_SIZE);
		set({ offlineQueue: newQueue });

		// Persist to AsyncStorage
		try {
			await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(newQueue));
		} catch (error) {
			console.error('Failed to persist offline queue:', error);
		}
	},

	// Load offline queue from AsyncStorage
	loadOfflineQueue: async () => {
		try {
			const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
			if (stored) {
				const queue = JSON.parse(stored);
				set({ offlineQueue: queue });
				console.log(`Loaded ${queue.length} locations from offline queue`);
			}
		} catch (error) {
			console.error('Failed to load offline queue:', error);
		}
	},

	// Flush offline queue when connection is restored
	flushOfflineQueue: async () => {
		const { offlineQueue, isFlushQueue } = get();

		if (isFlushQueue || offlineQueue.length === 0) return;

		const socket = getSocket();
		if (!socket || !socket.connected) return;

		set({ isFlushQueue: true });

		try {
			console.log(`Flushing ${offlineQueue.length} offline locations...`);

			// Send all queued locations
			for (const locationData of offlineQueue) {
				socket.emit("location:update", locationData);
				// Small delay to avoid overwhelming the server
				await new Promise(resolve => setTimeout(resolve, 50));
			}

			// Clear queue on success
			set({ offlineQueue: [] });
			await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);

			console.log('Offline queue flushed successfully');
		} catch (error) {
			console.error('Failed to flush offline queue:', error);
		} finally {
			set({ isFlushQueue: false });
		}
	},

	setOnlineStatus: (online: boolean) => {
		set({ isConnected: online });
	},

	clearError: () => {
		set({ error: null });
	},
}));