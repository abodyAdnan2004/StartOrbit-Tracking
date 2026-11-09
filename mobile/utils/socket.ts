import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export const initializeSocket = (token: string) => {
  if (socket?.connected) {
    console.log('Socket already connected');
    return socket;
  }

  socket = io(API_BASE_URL, {
    auth: { token },
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
    useLocationStore.getState().setOnlineStatus(true);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    useLocationStore.getState().setOnlineStatus(false);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
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
  'auth:success': (data: { userId: number; role: string; message: string }) => void;
  'auth:error': (data: { message: string }) => void;
  'location:update': (data: LocationUpdateData) => void;
  'location:batch': (locations: LocationUpdateData[]) => void;
  'location:ack': (data: { id: number; timestamp: Date }) => void;
  'location:batch:ack': (data: { count: number; ids: number[] }) => void;
  'subscribe:user': (userId: number) => void;
  'unsubscribe:user': (userId: number) => void;
  'get:online-users': () => void;
  'users:online': (users: OnlineUser[]) => void;
  'user:online': (user: OnlineUser) => void;
  'user:offline': (data: { userId: number }) => void;
  'ping': () => void;
  'pong': (data: { timestamp: number }) => void;
}

export interface LocationUpdateData {
  userId: number;
  userName: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
  customerId?: number;
}

export interface OnlineUser {
  id: number;
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