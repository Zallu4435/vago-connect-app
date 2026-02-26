import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { isTokenExpired } from '@/lib/tokenManager';

export function useAuth() {
  const router = useRouter();
  const userInfo = useAuthStore((s) => s.userInfo);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const scheduleRefresh = useAuthStore((s) => s.scheduleRefresh);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      try {
        if (accessToken && !isTokenExpired(accessToken)) {
          scheduleRefresh?.(() => { });
        }
      } catch { }
      if (mounted) setIsLoading(false);
    };
    bootstrap();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await api.post('/api/auth/logout', undefined, { withCredentials: true });
    } catch {
      // ignore — still clear local state
    } finally {
      clearAuth();
      router.push('/login');
      // isLoggingOut stays true briefly during navigation; the component unmounts naturally
    }
  };

  return {
    user: userInfo,
    isAuthenticated: Boolean(accessToken) && !isTokenExpired(accessToken || ''),
    isLoading,
    isLoggingOut,
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


