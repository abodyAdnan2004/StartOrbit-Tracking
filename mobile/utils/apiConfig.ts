import Constants from 'expo-constants';

/**
 * Shared API base URL resolution for both socket and HTTP connections.
 * This eliminates duplicate logic between socket.ts and api.ts
 */
export const getApiBaseUrl = (): string => {
  // First check environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace('/api', '');
  }

  // Try to get from Expo config (extra.apiUrl)
  const extraApiUrl = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.apiUrl as string | undefined;
  if (extraApiUrl) {
    return extraApiUrl.replace('/api', '');
  }

  // For Expo development, try to detect the host from the manifest URL
  // This works when running on physical device via Expo Go
  const manifest2Extra = (Constants.manifest2?.extra as Record<string, unknown> | undefined)?.apiUrl as string | undefined;
  if (manifest2Extra) {
    return manifest2Extra.replace('/api', '');
  }

  // Fallback: try to construct from the debugger host
  // This works for iOS simulator and Android emulator
  if (__DEV__ && (Constants.manifest as Record<string, unknown> | undefined)?.debuggerHost) {
    const host = (Constants.manifest as Record<string, unknown>).debuggerHost as string;
    const hostname = host.split(':')[0];
    return `http://${hostname}:3000`;
  }

  // Default fallback
  return 'http://localhost:3000';
};

/**
 * Get the full API URL with /api prefix for HTTP requests
 */
export const getFullApiUrl = (): string => {
  return `${getApiBaseUrl()}/api`;
};

/**
 * Get the WebSocket base URL (without /api prefix)
 */
export const getSocketBaseUrl = (): string => {
  return getApiBaseUrl();
};

export const API_BASE_URL = getFullApiUrl();
export const SOCKET_BASE_URL = getSocketBaseUrl();