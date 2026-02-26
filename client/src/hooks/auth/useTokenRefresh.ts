import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getTokenExpiry } from '@/lib/tokenManager';
import { refreshAccessToken } from '@/lib/refreshToken';

export function useTokenRefresh() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // cleanup existing
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current as unknown as number);
      timeoutRef.current = null;
    }

    if (!accessToken) return;

    const expiryTime = getTokenExpiry(accessToken);
    if (!expiryTime) return;

    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    const refreshDelay = expiryTime - fiveMinutes - now;

    if (refreshDelay <= 0) {
      // Expired or expiring soon: refresh immediately
      refreshAccessToken().catch(() => {
        clearAuth();
        if (typeof window !== 'undefined') window.location.href = '/login';
      });
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        await refreshAccessToken();
      } catch (e) {
        clearAuth();
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }, refreshDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current as unknown as number);
        timeoutRef.current = null;
      }
    };
  }, [accessToken, clearAuth]);
}
