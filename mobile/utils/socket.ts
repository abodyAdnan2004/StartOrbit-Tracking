import { io, Socket } from 'socket.io-client';
import { getSocketBaseUrl } from './apiConfig';

const SOCKET_BASE_URL = getSocketBaseUrl();

let socket: Socket | null = null;

// Callbacks to avoid circular dependency with locationStore
let onConnectCallback: (() => void) | null = null;
let onDisconnectCallback: ((reason: string) => void) | null = null;
let onConnectErrorCallback: ((error: Error) => void) | null = null;
let onAuthErrorCallback: (() => void) | null = null;

export const setSocketCallbacks = (callbacks: {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onConnectError?: (error: Error) => void;
  onAuthError?: () => void;
}) => {
  onConnectCallback = callbacks.onConnect ?? null;
  onDisconnectCallback = callbacks.onDisconnect ?? null;
  onConnectErrorCallback = callbacks.onConnectError ?? null;
  onAuthErrorCallback = callbacks.onAuthError ?? null;
};

export const initializeSocket = (token: string) => {
  if (socket?.connected) {
    console.log('Socket already connected to:', SOCKET_BASE_URL);
    return socket;
  }

  console.log('Initializing socket connection to:', SOCKET_BASE_URL);

  socket = io(SOCKET_BASE_URL, {
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
    onConnectCallback?.();
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    onDisconnectCallback?.(reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
    onConnectErrorCallback?.(error);
  });

  socket.on('auth:success', (data) => {
    console.log('Socket authenticated:', data);
  });

  socket.on('auth:error', (data) => {
    console.error('Socket auth error:', data);
    onAuthErrorCallback?.();
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
  'location:mobile-backend': (data: LocationUpdateData) => void;
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