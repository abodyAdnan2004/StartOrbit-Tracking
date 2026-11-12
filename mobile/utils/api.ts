import axios, {
	AxiosInstance,
	AxiosError,
	InternalAxiosRequestConfig,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Get the API base URL from Expo config or environment
// For mobile devices, we need to use the machine's IP, not localhost
const getApiBaseUrl = (): string => {
	// First check environment variable
	if (process.env.EXPO_PUBLIC_API_URL) {
		console.log(
			"process.env.EXPO_PUBLIC_API_URL",
			process.env.EXPO_PUBLIC_API_URL,
		);
		return process.env.EXPO_PUBLIC_API_URL;
	}

	// Try to get from Expo config (extra.apiUrl)
	const extraApiUrl = Constants.expoConfig?.extra?.apiUrl;
	if (extraApiUrl) {
		console.log("extraApiUrl", extraApiUrl);
		return extraApiUrl;
	}

	// For Expo development, try to detect the host from the manifest URL
	// This works when running on physical device via Expo Go
	if (Constants.manifest2?.extra?.apiUrl) {
		console.log(
			"Constants.manifest2.extra.apiUrl",
			Constants.manifest2.extra.apiUrl,
		);
		return Constants.manifest2.extra.apiUrl;
	}

	// Fallback: try to construct from the debugger host
	// This works for iOS simulator and Android emulator
	if (__DEV__ && Constants.manifest?.debuggerHost) {
		const host = Constants.manifest.debuggerHost.split(":")[0];
		return `http://${host}:3000/api`;
	}

	// Default fallback
	return "http://localhost:3000/api";
};

const API_BASE_URL = getApiBaseUrl();

// Type for the auth store getter - avoids circular dependency
type AuthStoreGetter = () => {
	updateUser: (user: Partial<any>) => void;
	logout: () => Promise<void>;
	getState: () => { token: string | null; refreshToken: string | null };
};

let authStoreGetter: AuthStoreGetter | null = null;

export const setAuthStoreGetter = (getter: AuthStoreGetter) => {
	authStoreGetter = getter;
};

class ApiClient {
	private client: AxiosInstance;
	private isRefreshing = false;
	private failedQueue: Array<{
		resolve: (value: unknown) => void;
		reject: (reason: unknown) => void;
	}> = [];

	constructor() {
		this.client = axios.create({
			baseURL: API_BASE_URL,
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			timeout: 30000,
		});

		// Add platform header for admin blocking
		this.client.interceptors.request.use((config) => {
			config.headers['X-Platform'] = 'mobile'
			return config
		})

		this.setupInterceptors();
	}

	private setupInterceptors() {
		// Request interceptor - add auth token
		this.client.interceptors.request.use(
			async (config: InternalAxiosRequestConfig) => {
				// Try auth store first (synchronous), fallback to AsyncStorage
				const storeToken = authStoreGetter?.()?.getState?.()?.token;
				if (storeToken) {
					config.headers.Authorization = `Bearer ${storeToken}`;
					return config;
				}

				// Fallback to AsyncStorage
				const token = await AsyncStorage.getItem("auth-storage");
				if (token) {
					try {
						const parsed = JSON.parse(token);
						if (parsed.state?.token) {
							config.headers.Authorization = `Bearer ${parsed.state.token}`;
						}
					} catch (e) {
						console.error("Failed to parse auth token", e);
					}
				}
				return config;
			},
			(error) => Promise.reject(error),
		);

		// Response interceptor - handle token refresh
		this.client.interceptors.response.use(
			(response) => response,
			async (error: AxiosError) => {
				const originalRequest =
					error.config as InternalAxiosRequestConfig & {
						_retry?: boolean;
					};

				if (error.response?.status === 401 && !originalRequest._retry) {
					if (this.isRefreshing) {
						// Queue the request
						return new Promise((resolve, reject) => {
							this.failedQueue.push({ resolve, reject });
						}).then(() => this.client(originalRequest));
					}

					originalRequest._retry = true;
					this.isRefreshing = true;

					try {
						// Get refresh token from auth store (synchronous, more reliable than AsyncStorage)
						const refreshToken =
							authStoreGetter?.()?.getState?.()?.refreshToken ??
							(await AsyncStorage.getItem("auth-storage").then(
								(t) => {
									if (t)
										return JSON.parse(t).state
											?.refreshToken;
									return null;
								},
							));

						if (!refreshToken) throw new Error("No refresh token");

						const response = await axios.post(
							`${API_BASE_URL}/auth/refresh`,
							{ refreshToken },
						);
						const { token, refreshToken: newRefreshToken } =
							response.data.token;

						// Update stored tokens in both AsyncStorage and auth store
						const stored =
							await AsyncStorage.getItem("auth-storage");
						if (stored) {
							const parsed = JSON.parse(stored);
							parsed.state.token = token;
							parsed.state.refreshToken = newRefreshToken;
							await AsyncStorage.setItem(
								"auth-storage",
								JSON.stringify(parsed),
							);
						}

						// Update auth store via getter
						if (authStoreGetter) {
							authStoreGetter().updateUser({});
							// Also update tokens directly in store
							const state = authStoreGetter().getState();
							if (state) {
								state.token = token;
								state.refreshToken = newRefreshToken;
							}
						}

						// Process queue
						this.failedQueue.forEach(({ resolve }) =>
							resolve(token),
						);
						this.failedQueue = [];

						// Retry original request
						originalRequest.headers.Authorization = `Bearer ${token}`;
						return this.client(originalRequest);
					} catch (refreshError) {
						this.failedQueue.forEach(({ reject }) =>
							reject(refreshError),
						);
						this.failedQueue = [];

						// Logout user via getter if available
						if (authStoreGetter) {
							await authStoreGetter().logout();
						}
						throw refreshError;
					} finally {
						this.isRefreshing = false;
					}
				}

				return Promise.reject(error);
			},
		);
	}

	// Helper methods
	async get<T>(url: string, config = {}) {
		const response = await this.client.get<T>(url, config);
		return response;
	}

	async post<T>(url: string, data = {}, config = {}) {
		const response = await this.client.post<T>(url, data, config);
		return response;
	}

	async put<T>(url: string, data = {}, config = {}) {
		const response = await this.client.put<T>(url, data, config);
		return response;
	}

	async patch<T>(url: string, data = {}, config = {}) {
		const response = await this.client.patch<T>(url, data, config);
		return response;
	}

	async delete<T>(url: string, config = {}) {
		const response = await this.client.delete<T>(url, config);
		return response;
	}
}

export const api = new ApiClient();

// Export for direct use if needed
export default api;