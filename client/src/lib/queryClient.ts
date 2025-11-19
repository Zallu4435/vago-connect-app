import { QueryClient, QueryCache } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { showToast } from '@/lib/toast';

function handleQueryError(error: unknown) {
  const err = error as (AxiosError<any> & { code?: string }) | any;
  try {
    if (err?.code === 'ERR_NETWORK') {
      showToast.error('Connection problem. Check your internet');
      return;
    }
    const status = err?.response?.status as number | undefined;
    if (status === 500) {
      showToast.error('Server error. Please try again later');
      return;
    }
    if (status === 401) {
      // handled by auth interceptor elsewhere
      return;
    }
    const message = err?.response?.data?.message || err?.message || 'Something went wrong';
    showToast.error(String(message));
  } catch {
    // Fallback to generic toast
    showToast.error('Something went wrong');
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const meta = (query?.meta || {}) as { silent?: boolean };
      if (meta?.silent) return;
      handleQueryError(error);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes (cache lifetime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
