import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await AsyncStorage.getItem('auth-storage');
        if (token) {
          try {
            const parsed = JSON.parse(token);
            if (parsed.state?.token) {
              config.headers.Authorization = `Bearer ${parsed.state.token}`;
            }
          } catch (e) {
            console.error('Failed to parse auth token', e);
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => this.client(originalRequest));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await AsyncStorage.getItem('auth-storage').then(t => {
              if (t) return JSON.parse(t).state?.refreshToken;
              return null;
            });

            if (!refreshToken) throw new Error('No refresh token');

            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
            const { token, refreshToken: newRefreshToken } = response.data.token;

            // Update stored tokens
            const stored = await AsyncStorage.getItem('auth-storage');
            if (stored) {
              const parsed = JSON.parse(stored);
              parsed.state.token = token;
              parsed.state.refreshToken = newRefreshToken;
              await AsyncStorage.setItem('auth-storage', JSON.stringify(parsed));
            }

            // Update auth store
            useAuthStore.getState().updateUser({}); // Trigger re-render with new token

            // Process queue
            this.failedQueue.forEach(({ resolve }) => resolve(token));
            this.failedQueue = [];

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.failedQueue.forEach(({ reject }) => reject(refreshError));
            this.failedQueue = [];

            // Logout user
            await useAuthStore.getState().logout();
            throw refreshError;
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Helper methods
  async get<T>(url: string, config = {}) {
    const response = await this.client.get<T>(url, config);
    return response;
  }

  async post<T>(url: string, data = {}, config = {}) {
    const response = await this.client.post<T>(url, data, config);
    return response;
  }

  async put<T>(url: string, data = {}, config = {}) {
    const response = await this.client.put<T>(url, data, config);
    return response;
  }

  async patch<T>(url: string, data = {}, config = {}) {
    const response = await this.client.patch<T>(url, data, config);
    return response;
  }

  async delete<T>(url: string, config = {}) {
    const response = await this.client.delete<T>(url, config);
    return response;
  }
}

export const api = new ApiClient();

// Export for direct use if needed
export default api;