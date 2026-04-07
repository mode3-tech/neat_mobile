import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { getOrCreateDeviceId } from './device.service';

let accessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onTokenRefreshed(token: string): void {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void): void {
  refreshSubscribers.push(cb);
}

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

function createApiInstance(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30_000,
  });

  // Attach JWT access token and X-Device-ID to every request
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      const deviceId = await getOrCreateDeviceId();
      config.headers['X-Device-ID'] = deviceId;

      return config;
    },
    (error: AxiosError) => Promise.reject(error),
  );

  // Handle 401 — auto-refresh tokens, queue concurrent requests
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (
        error.response?.status !== 401 ||
        !originalRequest ||
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest._retry
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // Another request is already refreshing — queue this one
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(instance(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const { authService } = await import('./auth.service');
        const tokens = await authService.refreshToken();
        if (tokens) {
          setAccessToken(tokens.access_token);
          onTokenRefreshed(tokens.access_token);
          originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
          return instance(originalRequest);
        }
      } catch {
        const { useAuthStore } = await import('@/stores/auth.store');
        useAuthStore.getState().clearAuth();
      } finally {
        isRefreshing = false;
      }

      return Promise.reject(error);
    },
  );

  return instance;
}

const api = createApiInstance(process.env.EXPO_PUBLIC_API_URL!);
const notificationApi = createApiInstance(process.env.EXPO_PUBLIC_NOTIFICATION_API_URL!);

export { api, notificationApi };
