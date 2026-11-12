import { Stack } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";
import { initializeSocket } from "@/utils/socket";

export default function RootLayout() {
	const { token, isHydrated, hydrate } = useAuthStore();

	// Hydrate auth state on app start
	useEffect(() => {
		if (isHydrated) {
			hydrate();
		}
	}, [isHydrated, hydrate]);

	useEffect(() => {
		if (token && isHydrated) {
			initializeSocket(token);
		}
	}, [token, isHydrated]);

	// Don't render until we know the auth state
	if (!isHydrated) {
		return null;
	}

	return (
		<Stack
			screenOptions={{
				headerShown: false,
				animation: "fade",
			}}
			unstable_settings={{
				initialRouteName: token ? "(tabs)/customers" : "auth/login",
			}}
		>
			<Stack.Screen name="index" options={{ presentation: "card" }} />
			<Stack.Screen name="auth" options={{ presentation: "modal" }} />
			<Stack.Screen name="(tabs)" options={{ presentation: "card" }} />
		</Stack>
	);
}
