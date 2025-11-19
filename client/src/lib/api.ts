import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { refreshAccessToken } from '@/lib/refreshToken';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005',
  timeout: 10000,
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
  try {
    const url = config.url || '';
    // Skip auth endpoints
    if (url.includes('/auth/')) return config;
    // Get token from store (memory only)
    const token = useAuthStore.getState().getAccessToken?.() || useAuthStore.getState().accessToken;
    if (token) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      } as any;
    }
  } catch {}
  return config;
});

// Response interceptor for errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config || {};
    const status = error?.response?.status as number | undefined;

    // Do not retry on auth endpoints
    const url: string = originalRequest?.url || '';
    const isAuthEndpoint = url.includes('/auth/');

    if (status === 403 || isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        // Store new token in memory
        useAuthStore.getState().setAccessToken(newToken || null);
        // Update header and retry
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${newToken}`,
        };
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed → logout and redirect
        try { useAuthStore.getState().clearAuth(); } catch {}
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
