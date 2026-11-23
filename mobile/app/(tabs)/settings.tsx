import { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
	Switch,
	ActivityIndicator,
	ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";

export default function SettingsScreen() {
	const { user, logout, isLoading, isHydrated } = useAuthStore();

	// Don't render until hydrated to avoid showing fallback values
	const [pushNotifications, setPushNotifications] = useState(true);
	const [backgroundTracking, setBackgroundTracking] = useState(true);
	const [autoSync, setAutoSync] = useState(true);
	if (!isHydrated) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#3B82F6" />
				</View>
			</SafeAreaView>
		);
	}

	const handleLogout = () => {
		Alert.alert("Logout", "Are you sure you want to logout?", [
			{ text: "Cancel", style: "cancel" },
			{ text: "Logout", style: "destructive", onPress: () => logout() },
		]);
	};

	const handleClearData = () => {
		Alert.alert(
			"Clear All Data",
			"This will clear all cached data and logout. Continue?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Clear",
					style: "destructive",
					onPress: () => {
						// Clear async storage and logout
						logout();
					},
				},
			],
		);
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.header}>
					<Text style={styles.headerTitle}>Settings</Text>
				</View>

				{/* Profile Section */}
				<View style={styles.section}>
					<View style={styles.profileCard}>
						<View style={styles.avatar}>
							<Text style={styles.avatarText}>
								{user?.fullName?.charAt(0) || "U"}
							</Text>
						</View>
						<View style={styles.profileInfo}>
							<Text style={styles.profileName}>
								{user?.fullName || "Unknown User"}
							</Text>
							<Text style={styles.profileEmail}>
								{user?.email || "No email"}
							</Text>
							<Text style={styles.profileRole}>
								{user?.role || "Field User"}
							</Text>
						</View>
					</View>
				</View>

				{/* Tracking Settings */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Location Tracking</Text>
					<View style={styles.settingsRow}>
						<View style={styles.toggleContent}>
							<Ionicons
								name="locate-outline"
								size={22}
								color="#3B82F6"
								style={styles.icon}
							/>
							<View>
								<Text style={styles.settingsLabel}>
									Background Tracking
								</Text>
								<Text style={styles.settingsDescription}>
									Track location when app is in background
								</Text>
							</View>
						</View>
						<Switch
							value={backgroundTracking}
							onValueChange={setBackgroundTracking}
							trackColor={{ false: "#E5E7EB", true: "#3B82F6" }}
							thumbColor={backgroundTracking ? "#3B82F6" : "#fff"}
						/>
					</View>
					<View style={styles.settingsRow}>
						<View style={styles.toggleContent}>
							<Ionicons
								name="sync-outline"
								size={22}
								color="#3B82F6"
								style={styles.icon}
							/>
							<View>
								<Text style={styles.settingsLabel}>
									Auto Sync
								</Text>
								<Text style={styles.settingsDescription}>
									Automatically sync when online
								</Text>
							</View>
						</View>
						<Switch
							value={autoSync}
							onValueChange={setAutoSync}
							trackColor={{ false: "#E5E7EB", true: "#3B82F6" }}
							thumbColor={autoSync ? "#3B82F6" : "#fff"}
						/>
					</View>
					<View style={styles.settingsRow}>
						<View style={styles.toggleContent}>
							<Ionicons
								name="notifications-outline"
								size={22}
								color="#3B82F6"
								style={styles.icon}
							/>
							<View>
								<Text style={styles.settingsLabel}>
									Push Notifications
								</Text>
								<Text style={styles.settingsDescription}>
									Receive tracking alerts
								</Text>
							</View>
						</View>
						<Switch
							value={pushNotifications}
							onValueChange={setPushNotifications}
							trackColor={{ false: "#E5E7EB", true: "#3B82F6" }}
							thumbColor={pushNotifications ? "#3B82F6" : "#fff"}
						/>
					</View>
				</View>

				{/* Data Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Data</Text>
					<TouchableOpacity
						style={styles.settingsRow}
						onPress={() =>
							Alert.alert("Export Data", "Feature coming soon")
						}
					>
						<Ionicons
							name="download-outline"
							size={22}
							color="#3B82F6"
							style={styles.icon}
						/>
						<Text style={styles.settingsLabel}>Export Data</Text>
						<Ionicons
							name="chevron-forward-outline"
							size={20}
							color="#9CA3AF"
						/>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.settingsRow}
						onPress={handleClearData}
					>
						<Ionicons
							name="trash-outline"
							size={22}
							color="#EF4444"
							style={styles.icon}
						/>
						<Text
							style={[styles.settingsLabel, { color: "#EF4444" }]}
						>
							Clear All Data
						</Text>
					</TouchableOpacity>
				</View>

				{/* About Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>About</Text>
					<View style={styles.settingsRow}>
						<View style={styles.toggleContent}>
							<Ionicons
								name="information-circle-outline"
								size={22}
								color="#3B82F6"
								style={styles.icon}
							/>
							<View>
								<Text style={styles.settingsLabel}>
									Orbit Tracking
								</Text>
								<Text style={styles.settingsDescription}>
									Version 1.0.0
								</Text>
							</View>
						</View>
					</View>
					<TouchableOpacity
						style={styles.settingsRow}
						onPress={() =>
							Alert.alert("Privacy Policy", "Feature coming soon")
						}
					>
						<Ionicons
							name="document-text-outline"
							size={22}
							color="#3B82F6"
							style={styles.icon}
						/>
						<Text style={styles.settingsLabel}>Privacy Policy</Text>
						<Ionicons
							name="chevron-forward-outline"
							size={20}
							color="#9CA3AF"
						/>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.settingsRow}
						onPress={() =>
							Alert.alert(
								"Terms of Service",
								"Feature coming soon",
							)
						}
					>
						<Ionicons
							name="document-text-outline"
							size={22}
							color="#3B82F6"
							style={styles.icon}
						/>
						<Text style={styles.settingsLabel}>
							Terms of Service
						</Text>
						<Ionicons
							name="chevron-forward-outline"
							size={20}
							color="#9CA3AF"
						/>
					</TouchableOpacity>
				</View>

				{/* Logout Button */}
				<TouchableOpacity
					style={styles.logoutButton}
					onPress={handleLogout}
					disabled={isLoading}
				>
					{isLoading ? (
						<ActivityIndicator size="large" color="white" />
					) : (
						<>
							<Ionicons
								name="log-out-outline"
								size={22}
								color="white"
								style={{ marginRight: 10 }}
							/>
							<Text style={styles.logoutButtonText}>Logout</Text>
						</>
					)}
				</TouchableOpacity>

				<View style={styles.footer}>
					<Text style={styles.footerText}>Orbit Tracking © 2026</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	scrollContent: {
		flexGrow: 1,
		paddingBottom: 20,
	},
	header: {
		paddingHorizontal: 20,
		paddingVertical: 16,
		backgroundColor: "white",
		borderBottomWidth: 1,
		borderBottomColor: "#E5E7EB",
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: "#111827",
	},
	section: {
		backgroundColor: "white",
		marginHorizontal: 16,
		marginTop: 16,
		borderRadius: 12,
		padding: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 6,
		elevation: 2,
	},
	sectionTitle: {
		fontSize: 13,
		fontWeight: "600",
		color: "#6B7280",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginBottom: 12,
	},
	profileCard: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 8,
	},
	avatar: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: "#DBEAFE",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 16,
	},
	avatarText: {
		fontSize: 22,
		fontWeight: "700",
		color: "#3B82F6",
	},
	profileInfo: {
		flex: 1,
	},
	profileName: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111827",
	},
	profileEmail: {
		fontSize: 14,
		color: "#6B7280",
		marginTop: 2,
	},
	profileRole: {
		fontSize: 12,
		fontWeight: "500",
		color: "#3B82F6",
		marginTop: 4,
		backgroundColor: "#DBEAFE",
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 10,
		alignSelf: "flex-start",
	},
	settingsRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
	},
	icon: {
		marginRight: 14,
		width: 28,
		textAlign: "center",
	},
	toggleContent: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},
	settingsLabel: {
		fontSize: 16,
		fontWeight: "500",
		color: "#111827",
	},
	settingsDescription: {
		fontSize: 12,
		color: "#9CA3AF",
		marginTop: 2,
	},
	debugToggle: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
	},
	debugSection: {
		marginTop: 12,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: "#F3F4F6",
	},
	debugLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: "#6B7280",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginTop: 12,
	},
	debugValue: {
		fontSize: 13,
		fontFamily: "monospace",
		color: "#374151",
		marginTop: 2,
		backgroundColor: "#F9FAFB",
		padding: 8,
		borderRadius: 6,
		borderWidth: 1,
		borderColor: "#E5E7EB",
	},
	logoutButton: {
		marginHorizontal: 16,
		marginTop: 24,
		marginBottom: 16,
		backgroundColor: "#EF4444",
		borderRadius: 12,
		paddingVertical: 16,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#EF4444",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 6,
		elevation: 3,
	},
	logoutButtonText: {
		fontSize: 16,
		fontWeight: "700",
		color: "white",
	},
	footer: {
		alignItems: "center",
		paddingVertical: 20,
	},
	footerText: {
		fontSize: 12,
		color: "#9CA3AF",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
});
