import axios from 'axios';
import { showToast } from '@/lib/toast';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005',
  timeout: 10000,
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
  try {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        // Ensure headers object exists and set Authorization header
        config.headers = {
          ...(config.headers || {}),
          Authorization: `Bearer ${token}`,
        } as any;
      }
    }
  } catch {}
  return config;
});

// Response interceptor for errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error?.response?.data || error?.message);
    try {
      const status = error?.response?.status as number | undefined;
      if (typeof window !== 'undefined' && (status === 401 || status === 440)) {
        // Clear token, notify user, and redirect to login
        try { localStorage.removeItem('token'); } catch {}
        showToast.error('Session expired. Please login again');
        // slight delay to allow toast to render before navigation
        setTimeout(() => { window.location.href = '/login'; }, 50);
        // Prevent further handling if desired
      }
    } catch {}
    return Promise.reject(error);
  }
);
