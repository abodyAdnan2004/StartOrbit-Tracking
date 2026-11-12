import { useEffect, useState } from "react";
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	RefreshControl,
	Alert,
	ActivityIndicator,
	TextInput,
	Modal,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Callout } from "react-native-maps";
import { useAuthStore } from "@/store/authStore";
import { useCustomerStore } from "@/store/customerStore";
import {
	Customer,
	CustomerCreateRequest,
	CustomerUpdateRequest,
} from "@/types/customer";

export default function CustomersScreen() {
	const { token, user, isHydrated } = useAuthStore();
	const {
		customers,
		isLoading,
		loadCustomers,
		createCustomer,
		updateCustomer,
		deleteCustomer,
		searchQuery,
		setSearchQuery,
		error: customerError,
		clearError,
	} = useCustomerStore();
	const [refreshing, setRefreshing] = useState(false);
	const [showAddModal, setShowAddModal] = useState(false);
	const [editingCustomer, setEditingCustomer] = useState<Customer | null>(
		null,
	);
	const [showLocationPicker, setShowLocationPicker] = useState(false);
	const [locationPickerCustomer, setLocationPickerCustomer] =
		useState<Customer | null>(null);
	const [pickedLocation, setPickedLocation] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);
	const [formData, setFormData] = useState<CustomerCreateRequest>({
		name: "",
		email: "",
		phone: "",
		address: "",
		notes: "",
		userId: user?.id || "",
		longitude: null,
		latitude: null,
		status: "pending",
	});
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	// Don't render until hydrated
	if (!isHydrated) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#3B82F6" />
			</View>
		);
	}

	useEffect(() => {
		if (token) {
			loadCustomers();
		}
	}, [token, loadCustomers]);

	const handleRefresh = async () => {
		setRefreshing(true);
		await loadCustomers();
		setRefreshing(false);
	};

	const filteredCustomers = customers.filter(
		(c) =>
			c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			c.phone?.includes(searchQuery),
	);

	const validateForm = () => {
		const errors: Record<string, string> = {};
		if (!formData.name.trim()) errors.name = "Name is required";
		if (formData.email && !/\S+@\S+\.\S+/.test(formData.email))
			errors.email = "Invalid email";
		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const resetForm = () => {
		setFormData({
			name: "",
			email: "",
			phone: "",
			address: "",
			notes: "",
			userId: user?.id || "",
			longitude: null,
			latitude: null,
			status: "pending",
		});
		setFormErrors({});
	};

	const handleSubmit = async () => {
		if (!validateForm()) return;

		try {
			if (editingCustomer) {
				await updateCustomer(
					editingCustomer.id,
					formData as CustomerUpdateRequest,
				);
				setShowAddModal(false);
				setEditingCustomer(null);
				resetForm();
			} else {
				const newCustomer = await createCustomer(formData);
				setShowAddModal(false);
				setEditingCustomer(null);
				resetForm();
				// Open location picker for the new customer
				setLocationPickerCustomer(newCustomer);
				setShowLocationPicker(true);
			}
		} catch (error: any) {
			Alert.alert("Error", error.message || "Failed to save customer");
		}
	};

	const handleEdit = (customer: Customer) => {
		setEditingCustomer(customer);
		setFormData({
			name: customer.name,
			email: customer.email || "",
			phone: customer.phone || "",
			address: customer.address || "",
			notes: customer.notes || "",
			userId: customer.userId || user?.id || "",
			longitude: customer.location?.[0] ?? null,
			latitude: customer.location?.[1] ?? null,
			status: customer.status || "pending",
		});
		setShowAddModal(true);
	};

	const handleLocationPickerOpen = (customer: Customer) => {
		setLocationPickerCustomer(customer);
		// Pre-fill picked location if customer already has coordinates
		if (customer.location?.[0] && customer.location?.[1]) {
			setPickedLocation({
				longitude: customer.location[0],
				latitude: customer.location[1],
			});
		} else {
			setPickedLocation(null);
		}
		setShowLocationPicker(true);
	};

	const handleLocationPickerConfirm = async () => {
		if (!pickedLocation || !locationPickerCustomer) return;

		try {
			await updateCustomer(locationPickerCustomer.id, {
				...formData,
				id: locationPickerCustomer.id,
				longitude: pickedLocation.longitude,
				latitude: pickedLocation.latitude,
			});
			setShowLocationPicker(false);
			setLocationPickerCustomer(null);
			setPickedLocation(null);
		} catch (error: any) {
			Alert.alert("Error", error.message || "Failed to update location");
		}
	};

	const handleMapPress = (event: any) => {
		const coordinate = event.nativeEvent.coordinate;
		setPickedLocation({
			latitude: coordinate.latitude,
			longitude: coordinate.longitude,
		});
	};

	const handleDelete = (customerId: string) => {
		Alert.alert(
			"Delete Customer",
			"Are you sure you want to delete this customer?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: () => deleteCustomer(customerId),
				},
			],
		);
	};

	const renderCustomer = ({ item }: { item: Customer }) => (
		<TouchableOpacity
			style={styles.customerCard}
			onPress={() => handleEdit(item)}
			activeOpacity={0.7}
		>
			<View style={styles.customerHeader}>
				<View style={styles.avatar}>
					<Text style={styles.avatarText}>
						{item.name.charAt(0).toUpperCase()}
					</Text>
				</View>
				<View style={styles.customerInfo}>
					<Text style={styles.customerName}>{item.name}</Text>
					<Text style={styles.customerMeta}>
						{item.email || "No email"}
					</Text>
				</View>
				{!item.isActive && (
					<Ionicons
						name="warning-outline"
						size={20}
						color="#F59E0B"
					/>
				)}
			</View>
			{item.phone && (
				<Text style={styles.customerPhone}>{item.phone}</Text>
			)}
			{item.address && (
				<Text style={styles.customerAddress}>{item.address}</Text>
			)}
			{item.location && (
				<Text style={styles.customerLocation}>
					📍 {item.location[1]?.toFixed(4)},{" "}
					{item.location[0]?.toFixed(4)}
				</Text>
			)}
			<View style={styles.customerActions}>
				<TouchableOpacity
					onPress={() => handleEdit(item)}
					style={styles.actionButton}
				>
					<Ionicons name="create-outline" size={18} color="#3B82F6" />
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => handleLocationPickerOpen(item)}
					style={styles.actionButton}
				>
					<Ionicons
						name="location-outline"
						size={18}
						color="#10B981"
					/>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => handleDelete(item.id)}
					style={styles.actionButton}
				>
					<Ionicons name="trash-outline" size={18} color="#EF4444" />
				</TouchableOpacity>
			</View>
		</TouchableOpacity>
	);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>My Customers</Text>
				<TouchableOpacity
					onPress={() => {
						resetForm();
						setEditingCustomer(null);
						setShowAddModal(true);
					}}
					style={styles.addButton}
				>
					<Ionicons name="add" size={22} color="white" />
				</TouchableOpacity>
			</View>

			<View style={styles.searchContainer}>
				<View style={styles.searchWrapper}>
					<Ionicons
						name="search-outline"
						size={20}
						color="#9CA3AF"
						style={styles.searchIcon}
					/>
					<TextInput
						style={styles.searchInput}
						placeholder="Search customers..."
						value={searchQuery}
						onChangeText={setSearchQuery}
						placeholderTextColor="#9CA3AF"
					/>
				</View>
			</View>

			{customerError && (
				<View style={styles.errorContainer}>
					<Text style={styles.errorText}>{customerError}</Text>
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

			<FlatList
				data={filteredCustomers}
				renderItem={renderCustomer}
				keyExtractor={(item) => item.id.toString()}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
					/>
				}
				ListEmptyComponent={
					<View style={styles.emptyState}>
						<Ionicons
							name="people-outline"
							size={48}
							color="#D1D5DB"
						/>
						<Text style={styles.emptyText}>No customers yet</Text>
						<Text style={styles.emptySubtext}>
							Tap + to add your first customer
						</Text>
					</View>
				}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
			/>

			{/* Add/Edit Customer Modal */}
			<Modal
				visible={showAddModal}
				animationType="slide"
				transparent={true}
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					style={styles.modalOverlay}
					keyboardVerticalOffset={0}
				>
					<View style={styles.modalContainer}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>
								{editingCustomer
									? "Edit Customer"
									: "Add Customer"}
							</Text>
							<TouchableOpacity
								onPress={() => {
									setShowAddModal(false);
									resetForm();
									setEditingCustomer(null);
								}}
								style={styles.closeButton}
							>
								<Ionicons
									name="close-outline"
									size={24}
									color="#6B7280"
								/>
							</TouchableOpacity>
						</View>

						<ScrollView
							contentContainerStyle={styles.modalContent}
							showsVerticalScrollIndicator={false}
						>
							<View style={styles.formGroup}>
								<Text style={styles.formLabel}>Name *</Text>
								<TextInput
									style={styles.formInput}
									value={formData.name}
									onChangeText={(text) =>
										setFormData({ ...formData, name: text })
									}
									placeholder="Customer name"
									autoCapitalize="words"
								/>
								{formErrors.name && (
									<Text style={styles.formError}>
										{formErrors.name}
									</Text>
								)}
							</View>

							<View style={styles.formGroup}>
								<Text style={styles.formLabel}>Email</Text>
								<TextInput
									style={styles.formInput}
									value={formData.email}
									onChangeText={(text) =>
										setFormData({
											...formData,
											email: text,
										})
									}
									placeholder="customer@example.com"
									keyboardType="email-address"
									autoCapitalize="none"
								/>
								{formErrors.email && (
									<Text style={styles.formError}>
										{formErrors.email}
									</Text>
								)}
							</View>

							<View style={styles.formGroup}>
								<Text style={styles.formLabel}>Phone</Text>
								<TextInput
									style={styles.formInput}
									value={formData.phone}
									onChangeText={(text) =>
										setFormData({
											...formData,
											phone: text,
										})
									}
									placeholder="+1 (555) 123-4567"
									keyboardType="phone-pad"
								/>
							</View>

							<View style={styles.formGroup}>
								<Text style={styles.formLabel}>Address</Text>
								<TextInput
									style={styles.formInput}
									value={formData.address}
									onChangeText={(text) =>
										setFormData({
											...formData,
											address: text,
										})
									}
									placeholder="123 Main St, City, State"
									multiline
									numberOfLines={2}
								/>
							</View>

							<View style={styles.formGroup}>
								<Text style={styles.formLabel}>Notes</Text>
								<TextInput
									style={styles.formInput}
									value={formData.notes}
									onChangeText={(text) =>
										setFormData({
											...formData,
											notes: text,
										})
									}
									placeholder="Additional notes..."
									multiline
									numberOfLines={3}
								/>
							</View>

							{/* Location Picker - Map integration would go here */}
							<View style={styles.formGroup}>
								<Text style={styles.formLabel}>
									Location (Optional)
								</Text>
								<View style={styles.locationInputs}>
									<View style={styles.locationInputWrapper}>
										<Text style={styles.locationInputLabel}>
											Longitude
										</Text>
										<TextInput
											style={styles.formInput}
											value={
												formData.longitude?.toString() ||
												""
											}
											onChangeText={(text) =>
												setFormData({
													...formData,
													longitude: text
														? parseFloat(text)
														: null,
												})
											}
											placeholder="-122.4194"
											keyboardType="decimal-pad"
										/>
									</View>
									<View style={styles.locationInputWrapper}>
										<Text style={styles.locationInputLabel}>
											Latitude
										</Text>
										<TextInput
											style={styles.formInput}
											value={
												formData.latitude?.toString() ||
												""
											}
											onChangeText={(text) =>
												setFormData({
													...formData,
													latitude: text
														? parseFloat(text)
														: null,
												})
											}
											placeholder="37.7749"
											keyboardType="decimal-pad"
										/>
									</View>
								</View>
								<Text style={styles.locationHint}>
									Tap to open map picker (requires
									react-native-maps)
								</Text>
							</View>
						</ScrollView>

						<View style={styles.modalActions}>
							<TouchableOpacity
								onPress={() => {
									setShowAddModal(false);
									resetForm();
									setEditingCustomer(null);
								}}
								style={styles.cancelButton}
							>
								<Text style={styles.cancelButtonText}>
									Cancel
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={handleSubmit}
								style={styles.saveButton}
								disabled={isLoading}
							>
								{isLoading ? (
									<ActivityIndicator
										size="small"
										color="white"
									/>
								) : (
									<Text style={styles.saveButtonText}>
										{editingCustomer ? "Update" : "Create"}
									</Text>
								)}
							</TouchableOpacity>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>

			{/* Location Picker Modal */}
			<Modal
				visible={showLocationPicker}
				animationType="slide"
				transparent={true}
			>
				<View
					style={styles.modalOverlay}
					onTouchStart={() => {
						setShowLocationPicker(false);
						setLocationPickerCustomer(null);
						setPickedLocation(null);
					}}
				>
					<View
						style={styles.modalContainer}
						onTouchStart={(e) => e.stopPropagation()}
					>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>
								{locationPickerCustomer
									? `Set Location: ${locationPickerCustomer.name}`
									: "Select Location"}
							</Text>
							<TouchableOpacity
								onPress={() => {
									setShowLocationPicker(false);
									setLocationPickerCustomer(null);
									setPickedLocation(null);
								}}
								style={styles.closeButton}
							>
								<Ionicons
									name="close-outline"
									size={24}
									color="#6B7280"
								/>
							</TouchableOpacity>
						</View>
						<View style={styles.modalContent}>
							<View style={styles.locationPickerMapContainer}>
								<MapView
									style={styles.locationPickerMap}
									region={{
										latitude: 33.33,
										longitude: 44.39,
										latitudeDelta: 0.0922,
										longitudeDelta: 0.0421,
									}}
									onPress={handleMapPress}
									showsUserLocation={true}
									showsMyLocationButton={true}
								>
									{pickedLocation && (
										<Marker
											coordinate={pickedLocation}
											title="Selected Location"
											pinColor="#10B981"
										>
											<Callout>
												<View style={styles.callout}>
													<Text
														style={
															styles.calloutTitle
														}
													>
														Selected Location
													</Text>
													<Text
														style={
															styles.calloutDetail
														}
													>
														{pickedLocation.latitude.toFixed(
															6,
														)}
														,{" "}
														{pickedLocation.longitude.toFixed(
															6,
														)}
													</Text>
												</View>
											</Callout>
										</Marker>
									)}
								</MapView>
							</View>
							<View style={styles.locationPickerInfo}>
								<Text style={styles.locationPickerInstruction}>
									Tap on the map to select the customer
									location.
									{pickedLocation
										? " Drag marker to adjust."
										: ""}
								</Text>
								{pickedLocation && (
									<View style={styles.pickedCoords}>
										<Text style={styles.pickedCoordsLabel}>
											Coordinates:
										</Text>
										<Text style={styles.pickedCoordsValue}>
											{pickedLocation.latitude.toFixed(6)}
											,{" "}
											{pickedLocation.longitude.toFixed(
												6,
											)}
										</Text>
									</View>
								)}
							</View>
						</View>
						<View style={styles.modalActions}>
							<TouchableOpacity
								onPress={() => {
									setShowLocationPicker(false);
									setLocationPickerCustomer(null);
									setPickedLocation(null);
								}}
								style={styles.cancelButton}
							>
								<Text style={styles.cancelButtonText}>
									Cancel
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={handleLocationPickerConfirm}
								style={[
									styles.saveButton,
									!pickedLocation &&
										styles.saveButtonDisabled,
								]}
								disabled={!pickedLocation}
							>
								<Text style={styles.saveButtonText}>
									{locationPickerCustomer
										? "Update Location"
										: "Save Location"}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		marginTop: 60,
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
	addButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "#3B82F6",
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#3B82F6",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 3,
	},
	searchContainer: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: "white",
		borderBottomWidth: 1,
		borderBottomColor: "#E5E7EB",
	},
	searchWrapper: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F9FAFB",
		borderRadius: 10,
		paddingHorizontal: 12,
	},
	searchIcon: {
		marginRight: 8,
	},
	searchInput: {
		flex: 1,
		height: 44,
		fontSize: 16,
		color: "#111827",
	},
	listContent: {
		padding: 16,
		paddingBottom: 100,
	},
	customerCard: {
		backgroundColor: "white",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 6,
		elevation: 2,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	customerHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},
	avatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "#DBEAFE",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	avatarText: {
		fontSize: 18,
		fontWeight: "700",
		color: "#3B82F6",
	},
	customerInfo: {
		flex: 1,
	},
	customerName: {
		fontSize: 16,
		fontWeight: "600",
		color: "#111827",
	},
	customerMeta: {
		fontSize: 13,
		color: "#6B7280",
		marginTop: 2,
	},
	customerPhone: {
		fontSize: 14,
		color: "#374151",
		marginTop: 4,
	},
	customerAddress: {
		fontSize: 13,
		color: "#6B7280",
		marginTop: 2,
	},
	customerLocation: {
		fontSize: 12,
		color: "#3B82F6",
		marginTop: 2,
	},
	customerActions: {
		flexDirection: "row",
		justifyContent: "flex-end",
		marginTop: 12,
		gap: 8,
	},
	actionButton: {
		padding: 8,
		borderRadius: 8,
	},
	emptyState: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 40,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#374151",
		marginTop: 16,
	},
	emptySubtext: {
		fontSize: 14,
		color: "#9CA3AF",
		marginTop: 4,
		textAlign: "center",
	},
	modalOverlay: {
		flex: 1,
		justifyContent: "center",
		backgroundColor: "rgba(0,0,0,0.5)",
		padding: 20,
	},
	modalContainer: {
		backgroundColor: "white",
		borderRadius: 16,
		maxHeight: "85%",
		width: "100%",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.2,
		shadowRadius: 20,
		elevation: 10,
	},
	modalHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#E5E7EB",
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111827",
	},
	closeButton: {
		padding: 4,
	},
	modalContent: {
		padding: 20,
	},
	formGroup: {
		marginBottom: 20,
	},
	formLabel: {
		fontSize: 14,
		fontWeight: "500",
		color: "#374151",
		marginBottom: 8,
	},
	formInput: {
		backgroundColor: "#F9FAFB",
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#E5E7EB",
		paddingHorizontal: 12,
		paddingVertical: 12,
		fontSize: 16,
		color: "#111827",
	},
	formError: {
		fontSize: 12,
		color: "#EF4444",
		marginTop: 6,
		marginLeft: 4,
	},
	modalActions: {
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: 12,
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderTopWidth: 1,
		borderTopColor: "#E5E7EB",
	},
	cancelButton: {
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#D1D5DB",
	},
	cancelButtonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#374151",
	},
	saveButton: {
		backgroundColor: "#3B82F6",
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 10,
		justifyContent: "center",
		alignItems: "center",
	},
	saveButtonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "white",
	},
	errorContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#FEF2F2",
		borderWidth: 1,
		borderColor: "#FECACA",
		borderRadius: 8,
		padding: 12,
		marginHorizontal: 16,
		marginTop: 8,
	},
	errorText: {
		color: "#DC2626",
		fontSize: 14,
		flex: 1,
	},
	errorDismiss: {
		padding: 4,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#F9FAFB",
	},
	locationInputs: {
		flexDirection: "row",
		gap: 12,
	},
	locationInputWrapper: {
		flex: 1,
	},
	locationInputLabel: {
		fontSize: 12,
		color: "#6B7280",
		marginBottom: 4,
	},
	locationHint: {
		fontSize: 12,
		color: "#9CA3AF",
		marginTop: 8,
		fontStyle: "italic",
	},
	// Location Picker Modal Styles
	locationPickerMapContainer: {
		height: 300,
		borderRadius: 12,
		overflow: "hidden",
		marginBottom: 16,
	},
	locationPickerMap: {
		flex: 1,
	},
	locationPickerInfo: {
		paddingHorizontal: 4,
		paddingVertical: 8,
	},
	locationPickerInstruction: {
		fontSize: 14,
		color: "#6B7280",
		marginBottom: 8,
		textAlign: "center",
	},
	pickedCoords: {
		backgroundColor: "#F9FAFB",
		borderRadius: 8,
		padding: 12,
	},
	pickedCoordsLabel: {
		fontSize: 13,
		fontWeight: "600",
		color: "#374151",
		marginBottom: 4,
	},
	pickedCoordsValue: {
		fontSize: 13,
		fontFamily: "monospace",
		color: "#3B82F6",
	},
	saveButtonDisabled: {
		opacity: 0.5,
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
});
