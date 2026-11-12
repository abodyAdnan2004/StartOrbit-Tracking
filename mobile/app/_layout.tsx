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

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
      unstable_settings={{
        initialRouteName: isHydrated ? (token ? '(tabs)/customers' : 'auth/login') : 'index',
      }}
    >
      <Stack.Screen name="index" options={{ presentation: 'card' }} />
      <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
      <Stack.Screen name="(tabs)" options={{ presentation: 'card' }} />
    </Stack>
  );
}