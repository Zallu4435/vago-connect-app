import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';
import { refreshAccessToken } from '@/lib/refreshToken';
import { api } from '@/lib/api';
import { isTokenExpired } from '@/lib/tokenManager';

export function useAuth() {
  const userInfo = useAuthStore((s) => s.userInfo);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const scheduleRefresh = useAuthStore((s) => s.scheduleRefresh);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      try {
        if (accessToken && !isTokenExpired(accessToken)) {
          // ensure refresh is scheduled if not already
          scheduleRefresh?.(() => {
            refreshAccessToken().catch(() => clearAuth());
          });
          if (mounted) setIsLoading(false);
          return;
        }
        await refreshAccessToken();
      } catch {}
      if (mounted) setIsLoading(false);
    };
    bootstrap();
    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    try {
      await api.post('/api/auth/logout', undefined, { withCredentials: true });
    } finally {
      clearAuth();
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
  };

  return {
    user: userInfo,
    isAuthenticated: Boolean(accessToken) && !isTokenExpired(accessToken || ''),
    isLoading,
    logout,
  } as const;
}

export function useRequireAuth(redirectTo = '/login') {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  useEffect(() => {
    if (!accessToken) {
      router.push(redirectTo);
    }
  }, [accessToken, router, redirectTo]);
}

export function useIsAuthenticated() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return Boolean(accessToken) && !isTokenExpired(accessToken || '');
}
