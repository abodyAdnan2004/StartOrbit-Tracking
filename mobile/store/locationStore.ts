import { create } from "zustand";
import { initializeSocket, disconnectSocket, getSocket } from "@/utils/socket";
import * as location from "expo-location";

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

let watchId: number | null = null;

export const useLocationStore = create<LocationState>((set, get) => ({
	currentLocation: null,
	lastUpdate: null,
	isTracking: false,
	isConnected: false,
	error: null,

	startTracking: async (token: string) => {
		try {
			// Initialize socket connection using shared utility
			initializeSocket(token);

			// Request location permissions
			const { status } = await location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				throw new Error("Location permission not granted");
			}

			// Start watching location
			watchId = await location.watchPositionAsync(
				{
					accuracy: location.Accuracy.High,
					timeInterval: 15000, // 15 seconds
					distanceInterval: 10, // 10 meters
				},
				(_location: typeof location) => {
					const socket = getSocket();
					const locationData: LocationType = {
						id: _location.id,
						userId: _location.userId || "",
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
			location.clearWatchAsync(watchId);
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

		// Send via socket (real-time only)
		const socket = getSocket();
		if (socket && socket.connected) {
			socket.emit("location:update", locationData);
		}
	},

	setOnlineStatus: (online: boolean) => {
		set({ isConnected: online });
	},

	clearError: () => {
		set({ error: null });
	},
}));