import { useAuthStore } from '@/stores/authStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function refreshAccessToken(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      throw new Error('Refresh failed');
    }
    const data = await res.json();
    const accessToken = data?.accessToken as string | undefined;
    if (!accessToken) {
      throw new Error('No access token in refresh response');
    }
    // Update store and (optionally) reschedule refresh via store API
    useAuthStore.getState().setAccessToken(accessToken);
    useAuthStore.getState().scheduleRefresh?.(() => {
      // On scheduled refresh, call refreshAccessToken again
      refreshAccessToken().catch(() => {
        // If scheduled refresh fails, clear auth
        useAuthStore.getState().clearAuth();
      });
    });
    return accessToken;
  } catch (err) {
    try { useAuthStore.getState().clearAuth(); } catch {}
    throw err;
  }
}
