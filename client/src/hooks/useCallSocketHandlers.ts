import { useEffect } from 'react';
import { useSocketStore } from '@/stores/socketStore';
import { useCallStore } from '@/stores/callStore';
import { showToast } from '@/lib/toast';

export function useCallSocketHandlers() {
  const socket = useSocketStore((s) => s.socket);
  const setCall = useCallStore((s) => s.setCall);
  const setAudioCall = useCallStore((s) => s.setAudioCall);
  const setVideoCall = useCallStore((s) => s.setVideoCall);
  const acceptCall = useCallStore((s) => s.acceptCall);
  const rejectCall = useCallStore((s) => s.rejectCall);
  const endCall = useCallStore((s) => s.endCall);

  useEffect(() => {
    if (!socket.current) return;

    socket.current.on('incoming-call', (data: any) => {
      setCall(data);
      if (data?.callType === 'audio') setAudioCall(true);
      if (data?.callType === 'video') setVideoCall(true);
    });
    socket.current.on('call-accepted', () => {
      acceptCall();
    });
    socket.current.on('call-rejected', () => {
      rejectCall();
      endCall();
    });
    socket.current.on('call-ended', () => {
      endCall();
    });
    socket.current.on('call-busy', () => {
      showToast.info('User is busy with another ritual.');
    });
    socket.current.on('call-failed', () => {
      showToast.error('Call failed. The spirits are not listening.');
    });

    return () => {
      if (!socket.current) return;
      socket.current.off('incoming-call');
      socket.current.off('call-accepted');
      socket.current.off('call-rejected');
      socket.current.off('call-ended');
      socket.current.off('call-busy');
      socket.current.off('call-failed');
    };
  }, [socket.current, setCall, setAudioCall, setVideoCall, acceptCall, rejectCall, endCall]);
}
