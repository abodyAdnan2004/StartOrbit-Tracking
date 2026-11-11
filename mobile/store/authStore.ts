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
						loginIdentifier: email,
						password,
						rememberMe,
					})) as { data: AuthResponse };

					const { user, token } = response.data;

					set({
						user,
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
					set({
						user: null,
						token: null,
						refreshToken: null,
					});
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
						set({ user: response.data.data });
					} catch (error) {
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

					set({
						user,
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

// Initialize auth on app start
export const initializeAuth = async () => {
	await useAuthStore.getState().hydrate();
};

// Register the auth store getter for api.ts to use (breaks circular dependency)
setAuthStoreGetter(() => ({
	updateUser: useAuthStore.getState().updateUser,
	logout: useAuthStore.getState().logout,
	getState: useAuthStore.getState,
}));
