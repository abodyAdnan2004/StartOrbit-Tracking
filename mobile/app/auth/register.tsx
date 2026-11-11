import { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	Alert,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";

export default function RegisterScreen() {
	const router = useRouter();
	const { register, isLoading } = useAuthStore();
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		password: "",
		confirmPassword: "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.firstName.trim()) {
			newErrors.firstName = "First name is required";
		}
		if (!formData.lastName.trim()) {
			newErrors.lastName = "Last name is required";
		}
		if (!formData.email.trim()) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = "Invalid email format";
		}
		if (!formData.phone.trim()) {
			newErrors.phone = "Phone number is required";
		}
		if (!formData.password) {
			newErrors.password = "Password is required";
		} else if (formData.password.length < 8) {
			newErrors.password = "Password must be at least 8 characters";
		}
		if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = "Passwords do not match";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleRegister = async () => {
		if (!validateForm()) return;

		try {
			await register({
				firstName: formData.firstName,
				lastName: formData.lastName,
				email: formData.email,
				phone: formData.phone,
				password: formData.password,
			});

			Alert.alert("Success", "Registration successful! Please sign in.", [
				{ text: "OK", onPress: () => router.replace("/auth/login") },
			]);
		} catch (error: any) {
			Alert.alert(
				"Registration Failed",
				error.message || "An error occurred",
			);
		}
	};

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: "" }));
		}
	};

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
		>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.logoContainer}>
					<Ionicons
						name="compass-outline"
						size={80}
						color="#3B82F6"
					/>
					<Text style={styles.appName}>Orbit Tracking</Text>
					<Text style={styles.tagline}>
						Field workforce location tracking
					</Text>
				</View>

				<View style={styles.formContainer}>
					<Text style={styles.title}>Create Account</Text>
					<Text style={styles.subtitle}>Sign up to get started</Text>

					<View style={styles.inputGroup}>
						<View style={styles.nameRow}>
							<View style={styles.halfWidth}>
								<Text style={styles.label}>First Name</Text>
								<View style={styles.inputWrapper}>
									<Ionicons
										name="person-outline"
										size={22}
										color="#9CA3AF"
										style={styles.inputIcon}
									/>
									<TextInput
										style={styles.input}
										value={formData.firstName}
										onChangeText={(value) =>
											handleInputChange(
												"firstName",
												value,
											)
										}
										placeholder="First name"
										autoCapitalize="words"
										returnKeyType="next"
										textContentType="givenName"
									/>
								</View>
								{errors.firstName && (
									<Text style={styles.errorText}>
										{errors.firstName}
									</Text>
								)}
							</View>
							<View style={styles.halfWidth}>
								<Text style={styles.label}>Last Name</Text>
								<View style={styles.inputWrapper}>
									<Ionicons
										name="person-outline"
										size={22}
										color="#9CA3AF"
										style={styles.inputIcon}
									/>
									<TextInput
										style={styles.input}
										value={formData.lastName}
										onChangeText={(value) =>
											handleInputChange("lastName", value)
										}
										placeholder="Last name"
										autoCapitalize="words"
										returnKeyType="next"
										textContentType="familyName"
									/>
								</View>
								{errors.lastName && (
									<Text style={styles.errorText}>
										{errors.lastName}
									</Text>
								)}
							</View>
						</View>
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.label}>Email</Text>
						<View style={styles.inputWrapper}>
							<Ionicons
								name="mail-outline"
								size={22}
								color="#9CA3AF"
								style={styles.inputIcon}
							/>
							<TextInput
								style={styles.input}
								value={formData.email}
								onChangeText={(value) =>
									handleInputChange("email", value)
								}
								placeholder="Enter your email"
								autoCapitalize="none"
								keyboardType="email-address"
								autoComplete="email"
								returnKeyType="next"
								textContentType="emailAddress"
							/>
						</View>
						{errors.email && (
							<Text style={styles.errorText}>{errors.email}</Text>
						)}
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.label}>Phone Number</Text>
						<View style={styles.inputWrapper}>
							<Ionicons
								name="call-outline"
								size={22}
								color="#9CA3AF"
								style={styles.inputIcon}
							/>
							<TextInput
								style={styles.input}
								value={formData.phone}
								onChangeText={(value) =>
									handleInputChange("phone", value)
								}
								placeholder="Enter phone number"
								keyboardType="phone-pad"
								autoComplete="tel"
								returnKeyType="next"
								textContentType="telephoneNumber"
							/>
						</View>
						{errors.phone && (
							<Text style={styles.errorText}>{errors.phone}</Text>
						)}
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.label}>Password</Text>
						<View style={styles.inputWrapper}>
							<Ionicons
								name="lock-closed-outline"
								size={22}
								color="#9CA3AF"
								style={styles.inputIcon}
							/>
							<TextInput
								style={styles.input}
								value={formData.password}
								onChangeText={(value) =>
									handleInputChange("password", value)
								}
								placeholder="Enter password"
								secureTextEntry={!showPassword}
								autoComplete="new-password"
								returnKeyType="next"
								textContentType="newPassword"
							/>
							<TouchableOpacity
								onPress={() => setShowPassword(!showPassword)}
								style={styles.eyeButton}
							>
								<Ionicons
									name={
										showPassword
											? "eye-off-outline"
											: "eye-outline"
									}
									size={22}
									color="#9CA3AF"
								/>
							</TouchableOpacity>
						</View>
						{errors.password && (
							<Text style={styles.errorText}>
								{errors.password}
							</Text>
						)}
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.label}>Confirm Password</Text>
						<View style={styles.inputWrapper}>
							<Ionicons
								name="lock-closed-outline"
								size={22}
								color="#9CA3AF"
								style={styles.inputIcon}
							/>
							<TextInput
								style={styles.input}
								value={formData.confirmPassword}
								onChangeText={(value) =>
									handleInputChange("confirmPassword", value)
								}
								placeholder="Confirm password"
								secureTextEntry={!showConfirmPassword}
								autoComplete="new-password"
								returnKeyType="go"
								textContentType="newPassword"
								onSubmitEditing={handleRegister}
							/>
							<TouchableOpacity
								onPress={() =>
									setShowConfirmPassword(!showConfirmPassword)
								}
								style={styles.eyeButton}
							>
								<Ionicons
									name={
										showConfirmPassword
											? "eye-off-outline"
											: "eye-outline"
									}
									size={22}
									color="#9CA3AF"
								/>
							</TouchableOpacity>
						</View>
						{errors.confirmPassword && (
							<Text style={styles.errorText}>
								{errors.confirmPassword}
							</Text>
						)}
					</View>

					<TouchableOpacity
						style={[
							styles.registerButton,
							isLoading && styles.registerButtonDisabled,
						]}
						onPress={handleRegister}
						disabled={isLoading}
						activeOpacity={0.8}
					>
						{isLoading ? (
							<ActivityIndicator size="large" color="white" />
						) : (
							<Text style={styles.registerButtonText}>
								Create Account
							</Text>
						)}
					</TouchableOpacity>
				</View>

				<View style={styles.footer}>
					<Text style={styles.footerText}>
						Already have an account?{" "}
					</Text>
					<TouchableOpacity
						onPress={() => router.replace("/auth/login")}
						style={styles.linkText}
					>
						<Text style={styles.linkText}>Sign In</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.footer}>
					<Text style={styles.footerText}>Orbit Tracking v1.0.0</Text>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	scrollContent: {
		flexGrow: 1,
		paddingHorizontal: 24,
		paddingVertical: 40,
		justifyContent: "center",
	},
	logoContainer: {
		alignItems: "center",
		marginBottom: 40,
	},
	appName: {
		fontSize: 28,
		fontWeight: "700",
		color: "#111827",
		marginTop: 12,
	},
	tagline: {
		fontSize: 14,
		color: "#6B7280",
		marginTop: 4,
	},
	formContainer: {
		width: "100%",
		maxWidth: 400,
		alignSelf: "center",
		backgroundColor: "white",
		borderRadius: 16,
		padding: 28,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 4,
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: "#111827",
		textAlign: "center",
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		color: "#6B7280",
		textAlign: "center",
		marginBottom: 28,
	},
	inputGroup: {
		marginBottom: 20,
	},
	nameRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 8,
	},
	halfWidth: {
		width: "48%",
	},
	label: {
		fontSize: 14,
		fontWeight: "500",
		color: "#374151",
		marginBottom: 8,
	},
	inputWrapper: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F9FAFB",
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#E5E7EB",
		paddingHorizontal: 12,
	},
	inputIcon: {
		marginRight: 10,
	},
	input: {
		flex: 1,
		height: 50,
		fontSize: 16,
		color: "#111827",
	},
	eyeButton: {
		padding: 8,
	},
	errorText: {
		fontSize: 12,
		color: "#EF4444",
		marginTop: 6,
		marginLeft: 4,
	},
	registerButton: {
		backgroundColor: "#3B82F6",
		borderRadius: 10,
		paddingVertical: 16,
		alignItems: "center",
		justifyContent: "center",
		minHeight: 52,
		marginTop: 8,
	},
	registerButtonDisabled: {
		backgroundColor: "#93C5FD",
	},
	registerButtonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "white",
	},
	footer: {
		marginTop: 32,
		alignItems: "center",
		flexDirection: "row",
	},
	footerText: {
		fontSize: 14,
		color: "#6B7280",
	},
	linkText: {
		fontSize: 14,
		color: "#3B82F6",
		fontWeight: "600",
	},
});
