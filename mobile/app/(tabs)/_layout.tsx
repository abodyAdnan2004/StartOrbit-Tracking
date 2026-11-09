import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useLocationStore } from '@/store/locationStore';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const { startTracking, stopTracking, isTracking } = useLocationStore();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1F2937' : 'white',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'people-outline' : 'people-sharp'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: 'Tracking',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'locate-outline' : 'locate-sharp'} size={24} color={color} />
          ),
          tabBarBadge: isTracking ? 'LIVE' : undefined,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'settings-outline' : 'settings-sharp'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}