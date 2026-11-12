import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import Constants from 'expo-constants';

// Get the API base URL from Expo config or environment
// For mobile devices, we need to use the machine's IP, not localhost
const getApiBaseUrl = (): string => {
  // First check environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace('/api', '');
  }

  // Try to get from Expo config (extra.apiUrl)
  const extraApiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (extraApiUrl) {
    return extraApiUrl.replace('/api', '');
  }

  // For Expo development, try to detect the host from the manifest URL
  // This works when running on physical device via Expo Go
  if (Constants.manifest2?.extra?.apiUrl) {
    return Constants.manifest2.extra.apiUrl.replace('/api', '');
  }

  // Fallback: try to construct from the debugger host
  // This works for iOS simulator and Android emulator
  if (__DEV__ && Constants.manifest?.debuggerHost) {
    const host = Constants.manifest.debuggerHost.split(':')[0];
    return `http://${host}:3000`;
  }

  // Default fallback
  return 'http://localhost:3000';
};

const API_BASE_URL = getApiBaseUrl();

let socket: Socket | null = null;

export const initializeSocket = (token: string) => {
  if (socket?.connected) {
    console.log('Socket already connected to:', API_BASE_URL);
    return socket;
  }

  console.log('Initializing socket connection to:', API_BASE_URL);

  socket = io(API_BASE_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
    // Send authentication token after connection
    socket?.emit('authenticate', token);
    useLocationStore.getState().setOnlineStatus(true);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    useLocationStore.getState().setOnlineStatus(false);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
    useLocationStore.getState().setOnlineStatus(false);
  });

  socket.on('auth:success', (data) => {
    console.log('Socket authenticated:', data);
  });

  socket.on('auth:error', (data) => {
    console.error('Socket auth error:', data);
    // Token might be expired, try to refresh
    useAuthStore.getState().refreshAccessToken().catch(() => {
      useAuthStore.getState().logout();
    });
  });

  // Listen for location updates from other users (for admin/manager)
  socket.on('location:update', (data) => {
    console.log('Received location update:', data);
    // This would be used in the dashboard/frontend, not mobile
  });

  // Listen for user online/offline status
  socket.on('user:online', (data) => {
    console.log('User online:', data);
  });

  socket.on('user:offline', (data) => {
    console.log('User offline:', data);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Socket event types for TypeScript
export interface SocketEvents {
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'connect_error': (error: Error) => void;
  'authenticate': (token: string) => void;
  'auth:success': (data: { userId: string; role: string; message: string }) => void;
  'auth:error': (data: { message: string }) => void;
  'location:update': (data: LocationUpdateData) => void;
  'location:batch': (locations: LocationUpdateData[]) => void;
  'location:ack': (data: { id: string; timestamp: Date }) => void;
  'location:batch:ack': (data: { count: number; ids: string[] }) => void;
  'subscribe:user': (userId: string) => void;
  'unsubscribe:user': (userId: string) => void;
  'get:online-users': () => void;
  'users:online': (users: OnlineUser[]) => void;
  'user:online': (user: OnlineUser) => void;
  'user:offline': (data: { userId: string }) => void;
  'ping': () => void;
  'pong': (data: { timestamp: number }) => void;
}

export interface LocationUpdateData {
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
  customerId?: string;
}

export interface OnlineUser {
  id: string;
  fullName: string;
  username: string;
  role: string;
  location: {
    latitude: number;
    longitude: number;
    timestamp: Date;
    accuracy?: number;
  } | null;
  isOnline: boolean;
}