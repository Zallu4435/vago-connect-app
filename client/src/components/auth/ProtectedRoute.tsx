import React, { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';
import { isTokenExpired } from '@/lib/tokenManager';
import { refreshAccessToken } from '@/lib/refreshToken';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        if (accessToken && !isTokenExpired(accessToken)) {
          if (mounted) setIsChecking(false);
          return;
        }
        // try silent refresh (cookie-based)
        await refreshAccessToken();
        if (mounted) setIsChecking(false);
      } catch (err) {
        if (!mounted) return;
        router.push(redirectTo);
      }
    };

    checkAuth();
    return () => {
      mounted = false;
    };
  }, [accessToken, router, redirectTo]);

  if (isChecking) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-conversation-panel-background text-white">
        <div className="mb-4 text-3xl">Whatsapp</div>
        <LoadingSpinner />
        <div className="mt-2 text-secondary">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
