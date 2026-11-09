import { Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { initializeSocket } from '@/utils/socket';

export default function RootLayout() {
  const { token, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

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
    >
      <Stack.Screen name="index" options={{ presentation: 'modal' }} />
      <Stack.Screen name="auth/login" options={{ presentation: 'modal' }} />
      <Stack.Screen name="auth/register" options={{ presentation: 'modal' }} />
      <Stack.Screen name="(tabs)" options={{ presentation: 'card' }} />
    </Stack>
  );
}