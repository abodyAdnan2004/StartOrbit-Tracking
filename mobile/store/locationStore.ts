import { create } from "zustand";
import {
	initializeSocket,
	disconnectSocket,
	getSocket,
	setSocketCallbacks,
} from "@/utils/socket";
import * as location from "expo-location";
import { useAuthStore } from "@/store/authStore";

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

interface LocationState {
	// Current location
	currentLocation: LocationType | null;
	lastUpdate: Date | null;

	// Tracking state
	isTracking: boolean;
	isConnected: boolean;

	// Error
	error: string | null;

	// Actions
	startTracking: (token: string) => Promise<void>;
	stopTracking: () => void;
	sendLocation: (location: LocationType) => Promise<void>;
	setOnlineStatus: (online: boolean) => void;
	clearError: () => void;
}

let watchId: location.LocationSubscription | null = null;

// Set up socket callbacks once when store is created
setSocketCallbacks({
	onConnect: () => {
		useLocationStore.getState().setOnlineStatus(true);
	},
	onDisconnect: () => {
		useLocationStore.getState().setOnlineStatus(false);
	},
	onConnectError: () => {
		useLocationStore.getState().setOnlineStatus(false);
	},
	onAuthError: async () => {
		// Token might be expired, the auth store will handle refresh/logout
		console.log("Socket auth error - token may be expired");
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
			// Initialize socket connection using shared utility
			// Permissions are already checked by the tracking screen
			initializeSocket(token);

			// Start watching location (permissions assumed granted by caller)
			watchId = await location.watchPositionAsync(
				{
					accuracy: location.Accuracy.High,
					timeInterval: 10000, // 1 second for testing
					distanceInterval: 1, // 0 meters for testing
				},
				(_location: location.LocationObject) => {
					const socket = getSocket();
					const { user } = useAuthStore.getState();

					// Ensure user is authenticated
					if (!user?.id) {
						console.warn(
							"No user ID available, skipping location update",
						);
						return;
					}

					const locationData: LocationType = {
						id:
							_location.coords.latitude.toString() +
							_location.coords.longitude.toString() +
							Date.now().toString(),
						userId: user.id,
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

		// Send via socket using dedicated event name
		const socket = getSocket();
		if (socket && socket.connected) {
			socket.emit("location:mobile-backend", locationData);
		}
	},

	setOnlineStatus: (online: boolean) => {
		set({ isConnected: online });
	},

	clearError: () => {
		set({ error: null });
	},
}));
