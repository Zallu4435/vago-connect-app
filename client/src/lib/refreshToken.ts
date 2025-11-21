import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';

let inFlight: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const { data } = await api.post('/api/auth/refresh');
      const accessToken = (data?.accessToken as string) || '';
      if (!accessToken) throw new Error('No access token in refresh response');
      useAuthStore.getState().setAccessToken(accessToken);
      useAuthStore.getState().scheduleRefresh?.(() => {
        refreshAccessToken().catch(() => {
          useAuthStore.getState().clearAuth();
        });
      });
      return accessToken;
    } catch (err) {
      try { useAuthStore.getState().clearAuth(); } catch {}
      throw err;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}
