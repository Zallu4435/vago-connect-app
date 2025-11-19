import { useEffect, useRef, useState } from 'react';
import { showToast } from '@/lib/toast';

export default function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const offlineToastId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initial = navigator.onLine;
    setIsOnline(initial);
    if (!initial) {
      // show persistent offline toast
      offlineToastId.current = showToast.networkStatus('No internet connection', true) as unknown as string;
    }

    const handleOnline = () => {
      setIsOnline(true);
      if (offlineToastId.current) {
        showToast.dismiss(offlineToastId.current);
        offlineToastId.current = undefined;
      }
      showToast.networkStatus('Connected', false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      offlineToastId.current = showToast.networkStatus('No internet connection', true) as unknown as string;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (offlineToastId.current) {
        showToast.dismiss(offlineToastId.current);
      }
    };
  }, []);

  return isOnline;
}
