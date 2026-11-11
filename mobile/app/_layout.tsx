import { Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { initializeSocket } from '@/utils/socket';

export default function RootLayout() {
  const { token, hydrate, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [isHydrated, hydrate]);

  useEffect(() => {
    if (token) {
      initializeSocket(token);
    }
  }, [token]);

  // Determine initial route based on auth state
  // This avoids navigation from index.tsx which causes "navigate before mount" errors
  // (tabs) is a route group, so we navigate to the first tab route instead
  const initialRouteName = isHydrated ? (token ? 'customers' : 'auth/login') : 'index';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
      initialRouteName={initialRouteName}
    >
      <Stack.Screen name="index" options={{ presentation: 'modal' }} />
      <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
      <Stack.Screen name="(tabs)" options={{ presentation: 'card' }} />
    </Stack>
  );
}