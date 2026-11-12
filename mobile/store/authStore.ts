import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, AuthResponse } from "@/types/auth";
import { setAuthStoreGetter } from "@/utils/api";

// Lazy import to avoid circular dependency
let api: any = null;
const getApi = async () => {
	if (!api) {
		const apiModule = await import("@/utils/api");
		api = apiModule.api;
	}
	return api;
};

interface AuthState {
	user: User | null;
	token: string | null;
	refreshToken: string | null;
	isHydrated: boolean;
	isLoading: boolean;

	// Actions
	login: (
		email: string,
		password: string,
		rememberMe?: boolean,
	) => Promise<void>;
	register: (data: any) => Promise<void>;
	logout: () => Promise<void>;
	hydrate: () => Promise<void>;
	refreshAccessToken: () => Promise<void>;
	updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			user: null,
			token: null,
			refreshToken: null,
			isHydrated: false,
			isLoading: false,

			login: async (
				email: string,
				password: string,
				rememberMe = true,
			) => {
				set({ isLoading: true });
				try {
					const apiClient = await getApi();
					const response = (await apiClient.post("/auth/login", {
						loginIdentifier: email,  // email OR username
						password,
						rememberMe,
						platform: 'mobile',  // Send platform hint
					})) as { data: AuthResponse };
					const { user, token } = response.data;

					// Normalize backend 'roles' to frontend 'role'
					const normalizedUser =
						user.role !== undefined
							? { ...user, role: user.role }
							: user;

					console.log(normalizedUser);
					console.log(token);

					set({
						user: normalizedUser,
						token: token.accessToken,
						refreshToken: token.refreshToken,
						isLoading: false,
					});
				} catch (error) {
					set({ isLoading: false });
					throw error;
				}
			},

			register: async (data: any) => {
				set({ isLoading: true });
				try {
					const apiClient = await getApi();
					const response = (await apiClient.post(
						"/auth/register",
						data,
					)) as { data: AuthResponse };
					set({ isLoading: false });
					// Don't auto-login after register
				} catch (error) {
					set({ isLoading: false });
					throw error;
				}
			},

			logout: async () => {
				const { refreshToken } = get();
				try {
					if (refreshToken) {
						const apiClient = await getApi();
						await apiClient.post("/auth/logout", { refreshToken });
					}
				} catch (error) {
					console.error("Logout error:", error);
				} finally {
					// Clear state
					set({
						user: null,
						token: null,
						refreshToken: null,
					});
					// Also clear AsyncStorage to ensure clean state
					try {
						await AsyncStorage.removeItem("auth-storage");
					} catch (e) {
						console.error("Failed to clear auth storage:", e);
					}
				}
			},

			hydrate: async () => {
				// This is called after persist rehydration
				set({ isHydrated: true });

				// Verify token is still valid
				const { token } = get();
				if (token) {
					try {
						const apiClient = await getApi();
						const response = await apiClient.get("/auth/me");
						// Normalize backend 'roles' to frontend 'role'
						const userData = response.data.data;
						const normalizedUser =
							userData.role !== undefined
								? { ...userData, role: userData.role }
								: userData;
						set({ user: normalizedUser });
					} catch (error) {
						console.error(
							"Token validation failed during hydrate:",
							error,
						);
						// Token invalid, clear auth
						get().logout();
					}
				}
			},

			refreshAccessToken: async () => {
				const { refreshToken } = get();
				if (!refreshToken) throw new Error("No refresh token");

				try {
					const apiClient = await getApi();
					const response = (await apiClient.post("/auth/refresh", {
						refreshToken,
					})) as { data: AuthResponse };
					const { user, token } = response.data;

					// Normalize backend 'roles' to frontend 'role'
					const normalizedUser =
						user.role !== undefined
							? { ...user, role: user.role }
							: user;

					set({
						user: normalizedUser,
						token: token.accessToken,
						refreshToken: token.refreshToken,
					});
				} catch (error) {
					// Refresh failed, logout
					get().logout();
					throw error;
				}
			},

			updateUser: (userData: Partial<User>) => {
				set((state) => ({
					user: state.user ? { ...state.user, ...userData } : null,
				}));
			},
		}),
		{
			name: "auth-storage",
			storage: createJSONStorage(() => AsyncStorage),
			partialize: (state) => ({
				user: state.user,
				token: state.token,
				refreshToken: state.refreshToken,
			}),
			onRehydrateStorage: () => (state) => {
				if (state) {
					state.isHydrated = true;
				}
			},
		},
	),
);

// Register the auth store getter for api.ts to use (breaks circular dependency)
setAuthStoreGetter(() => ({
	updateUser: useAuthStore.getState().updateUser,
	logout: useAuthStore.getState().logout,
	getState: useAuthStore.getState,
}));