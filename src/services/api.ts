import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { getOrCreateDeviceId } from './device.service';
import { getIntegrityStatus } from './security.service';

export class ApiError extends Error {
  code: string;
  status?: number;
  /** Seconds to wait before retrying, from a 429's `Retry-After` header or body. */
  retryAfter?: number;

  constructor(message: string, code: string, status?: number, retryAfter?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

// Pull a retry delay (in seconds) from the `Retry-After` header or an
// `error.retry_after` body field. Returns undefined if neither is a valid > 0.
function parseRetryAfter(response: AxiosResponse): number | undefined {
  const body = (response.data?.error as { retry_after?: unknown })?.retry_after;
  const header = response.headers?.['retry-after'];
  const raw = body ?? header;
  const seconds = typeof raw === 'string' ? parseInt(raw, 10) : typeof raw === 'number' ? raw : NaN;
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

export function throwApiError(error: unknown, fallback: string): never {
  if (error instanceof ApiError) throw error;
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    const serverError = error.response.data.error;
    if (serverError && typeof serverError === 'object' && typeof serverError.message === 'string') {
      throw new ApiError(
        serverError.message,
        typeof serverError.code === 'string' ? serverError.code : 'UNKNOWN',
        error.response.status,
        parseRetryAfter(error.response),
      );
    }
  }
  throw new ApiError(fallback, 'UNKNOWN');
}

let accessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  request: InternalAxiosRequestConfig;
}> = [];

function onTokenRefreshed(token: string, instance: AxiosInstance): void {
  refreshSubscribers.forEach(({ resolve, request }) => {
    request.headers.Authorization = `Bearer ${token}`;
    resolve(instance(request));
  });
  refreshSubscribers = [];
}

function onRefreshFailed(error: unknown): void {
  refreshSubscribers.forEach(({ reject }) => reject(error));
  refreshSubscribers = [];
}

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const getAccessToken = (): string | null => accessToken;

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
      config.headers['X-Device-Integrity'] = getIntegrityStatus();

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
        originalRequest._retry ||
        !accessToken // already logged out — don't attempt refresh
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // Another request is already refreshing — queue this one
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshSubscribers.push({ resolve, reject, request: originalRequest });
        });
      }

      isRefreshing = true;
      try {
        const { authService } = await import('./auth.service');
        const tokens = await authService.refreshToken();
        if (tokens) {
          setAccessToken(tokens.access_token);
          onTokenRefreshed(tokens.access_token, instance);
          originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
          return instance(originalRequest);
        }
      } catch {
        // refresh threw — fall through to clearAuth
      } finally {
        isRefreshing = false;
      }

      // Refresh failed (returned null or threw) — reject queued requests
      onRefreshFailed(error);

      const { useAuthStore } = await import('@/stores/auth.store');
      useAuthStore.getState().clearAuth();

      return Promise.reject(error);
    },
  );

  return instance;
}

const api = createApiInstance(process.env.EXPO_PUBLIC_API_URL!);

export { api };
