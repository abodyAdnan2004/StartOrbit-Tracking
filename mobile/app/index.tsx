import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const router = useRouter();
  const { token, isHydrated } = useAuthStore();

  useEffect(() => {
    if (isHydrated) {
      // Use setTimeout to defer navigation until after the Stack is mounted
      const timer = setTimeout(() => {
        if (token) {
          router.replace('/customers');
        } else {
          router.replace('/auth/login');
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isHydrated, token, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});