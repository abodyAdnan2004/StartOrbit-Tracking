import { useEffect, useState, useRef } from "react";
import {
	View,
	Text,
	StyleSheet,
	Alert,
	ActivityIndicator,
	Platform,
	TouchableOpacity,
} from "react-native";
import { MapView, Marker, Callout, Circle } from "@/components/map";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useAuthStore } from "@/store/authStore";
import { useLocationStore } from "@/store/locationStore";
import { initializeSocket, disconnectSocket } from "@/utils/socket";

export default function TrackingScreen() {
	const { token, user } = useAuthStore();
	const {
		currentLocation,
		isConnected,
		startTracking,
		stopTracking,
		isTracking,
		error,
		clearError,
	} = useLocationStore();
	const [mapRegion, setMapRegion] = useState({
		latitude: 37.78825,
		longitude: -122.4324,
		latitudeDelta: 0.0922,
		longitudeDelta: 0.0421,
	});
	const [permissionStatus, setPermissionStatus] =
		useState<Location.PermissionStatus | null>(null);
	const mapRef = useRef<MapView>(null);

	// Auto-start tracking when screen mounts
	useEffect(() => {
		if (token) {
			if (Platform.OS === "web") {
				// On web, use startTrackingWeb which uses browser Geolocation API
				useLocationStore.getState().startTrackingWeb(token);
				// Also get current position for initial map region
				getCurrentPositionForMap();
			} else {
				checkPermissionsAndStart();
				// Also get current position for initial map region
				getCurrentPositionForMap();
			}
		}
		return () => {
			// Cleanup on unmount
			stopTracking();
			disconnectSocket();
		};
	}, [token]);

	const checkPermissionsAndStart = async () => {
		const { status } = await Location.getForegroundPermissionsAsync();
		setPermissionStatus(status);

		let finalStatus = status;
		if (status !== "granted") {
			const { status: newStatus } =
				await Location.requestForegroundPermissionsAsync();
			setPermissionStatus(newStatus);
			finalStatus = newStatus;
		}

		if (finalStatus === "granted") {
			startTracking(token!);
		} else {
			clearError();
		}
	};

	// Get current position for initial map region (Phase 3 enhancement)
	const getCurrentPositionForMap = async () => {
		try {
			const { status } = await Location.getForegroundPermissionsAsync();
			if (status === "granted") {
				const currentPos = await Location.getCurrentPositionAsync({
					accuracy: Location.Accuracy.High,
				});
				setMapRegion({
					latitude: currentPos.coords.latitude,
					longitude: currentPos.coords.longitude,
					latitudeDelta: 0.0922,
					longitudeDelta: 0.0421,
				});
			}
		} catch (error) {
			console.log("Could not get initial position for map:", error);
			// Keep default region (San Francisco) as fallback
		}
	};

	useEffect(() => {
		if (currentLocation) {
			setMapRegion({
				...mapRegion,
				latitude: currentLocation.latitude,
				longitude: currentLocation.longitude,
			});
		}
	}, [currentLocation]);

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	};

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<Ionicons
						name="compass-outline"
						size={24}
						color="#3B82F6"
					/>
					<Text style={styles.headerTitle}>Live Location</Text>
				</View>
				<View style={styles.headerRight}>
					<View
						style={[
							styles.connectionDot,
							isConnected
								? styles.connectionDotConnected
								: styles.connectionDotDisconnected,
						]}
					/>
					<Text style={styles.connectionText}>
						{isConnected ? "Live" : "Offline"}
					</Text>
				</View>
			</View>

			{/* Map */}
			<MapView
				ref={mapRef}
				style={styles.map}
				region={mapRegion}
				showsUserLocation={true}
				showsMyLocationButton={true}
				followsUserLocation={isTracking}
				loadingEnabled
			>
				{currentLocation && (
					<Marker
						coordinate={{
							latitude: currentLocation.latitude,
							longitude: currentLocation.longitude,
						}}
						title="Your Location"
						description={`Accuracy: ${currentLocation.accuracy?.toFixed(1) || "N/A"}m`}
					>
						<Callout>
							<View style={styles.callout}>
								<Text style={styles.calloutTitle}>
									Current Position
								</Text>
								<Text style={styles.calloutDetail}>
									{currentLocation.latitude.toFixed(6)},{" "}
									{currentLocation.longitude.toFixed(6)}
								</Text>
								<Text style={styles.calloutDetail}>
									Accuracy:{" "}
									{currentLocation.accuracy?.toFixed(1) ||
										"N/A"}
									m
								</Text>
								{currentLocation.speed && (
									<Text style={styles.calloutDetail}>
										Speed:{" "}
										{currentLocation.speed.toFixed(1)} m/s
									</Text>
								)}
							</View>
						</Callout>
					</Marker>
				)}

				{/* Accuracy Circle */}
				{currentLocation && currentLocation.accuracy && (
					<Circle
						center={{
							latitude: currentLocation.latitude,
							longitude: currentLocation.longitude,
						}}
						radius={currentLocation.accuracy}
						strokeWidth={0}
						fillColor="#3B82F633"
						strokeColor="#3B82F680"
					/>
				)}
			</MapView>

			{/* Current Location Info Card */}
			{currentLocation && (
				<View style={styles.infoCard}>
					<View style={styles.infoRow}>
						<View style={styles.infoItem}>
							<Text style={styles.infoLabel}>Latitude</Text>
							<Text style={styles.infoValue}>
								{currentLocation.latitude.toFixed(6)}
							</Text>
						</View>
						<View style={styles.infoItem}>
							<Text style={styles.infoLabel}>Longitude</Text>
							<Text style={styles.infoValue}>
								{currentLocation.longitude.toFixed(6)}
							</Text>
						</View>
					</View>
					<View style={styles.infoRow}>
						<View style={styles.infoItem}>
							<Text style={styles.infoLabel}>Accuracy</Text>
							<Text
								style={[
									styles.infoValue,
									{
										color:
											currentLocation.accuracy &&
											currentLocation.accuracy <= 10
												? "#10B981"
												: currentLocation.accuracy &&
													  currentLocation.accuracy <=
															30
													? "#F59E0B"
													: "#EF4444",
									},
								]}
							>
								{currentLocation.accuracy
									? currentLocation.accuracy.toFixed(1)
									: "N/A"}
								m
							</Text>
						</View>
						<View style={styles.infoItem}>
							<Text style={styles.infoLabel}>Speed</Text>
							<Text style={styles.infoValue}>
								{currentLocation.speed
									? currentLocation.speed.toFixed(1) + " m/s"
									: "N/A"}
							</Text>
						</View>
					</View>
				</View>
			)}

			{error && (
				<View style={styles.errorBanner}>
					<Ionicons
						name="alert-circle-outline"
						size={18}
						color="#EF4444"
						style={{ marginRight: 8 }}
					/>
					<Text style={styles.errorText}>{error}</Text>
					<TouchableOpacity
						onPress={clearError}
						style={styles.errorDismiss}
					>
						<Ionicons
							name="close-outline"
							size={18}
							color="#EF4444"
						/>
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginTop: 50,
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 16,
		backgroundColor: "white",
		borderBottomWidth: 1,
		borderBottomColor: "#E5E7EB",
	},
	headerLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: "#111827",
	},
	headerRight: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	connectionDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	connectionDotConnected: {
		backgroundColor: "#10B981",
	},
	connectionDotDisconnected: {
		backgroundColor: "#EF4444",
	},
	connectionText: {
		fontSize: 13,
		fontWeight: "600",
		color: "#374151",
	},
	map: {
		flex: 1,
	},
	callout: {
		padding: 8,
		minWidth: 200,
	},
	calloutTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#111827",
		marginBottom: 4,
	},
	calloutDetail: {
		fontSize: 12,
		color: "#6B7280",
		marginBottom: 2,
	},
	infoCard: {
		position: "absolute",
		bottom: 24,
		left: 16,
		right: 16,
		backgroundColor: "white",
		borderRadius: 12,
		padding: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 6,
		borderWidth: 1,
		borderColor: "#E5E7EB",
		zIndex: 1000,
	},
	infoRow: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	infoItem: {
		flex: 1,
	},
	infoLabel: {
		fontSize: 11,
		color: "#9CA3AF",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginBottom: 2,
	},
	infoValue: {
		fontSize: 14,
		fontWeight: "600",
		color: "#111827",
		fontFamily: "monospace",
	},
	errorBanner: {
		position: "absolute",
		top: 80,
		left: 16,
		right: 16,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: "#FEF2F2",
		borderRadius: 8,
		padding: 12,
		borderWidth: 1,
		borderColor: "#FECACA",
	},
	errorText: {
		fontSize: 13,
		color: "#DC2626",
		flex: 1,
	},
	errorDismiss: {
		padding: 4,
	},
});
