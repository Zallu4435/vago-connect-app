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
    const s = socket.current;
    if (!s) return;

    const onIncomingCall = (data: any) => {
      setCall(data);
      if (data?.callType === 'audio') setAudioCall(true);
      if (data?.callType === 'video') setVideoCall(true);
    };
    const onCallAccepted = () => {
      acceptCall();
    };
    const onCallRejected = () => {
      rejectCall();
      endCall();
    };
    const onCallEnded = () => {
      endCall();
    };
    const onCallBusy = () => {
      showToast.info('User is busy with another ritual.');
    };
    const onCallFailed = () => {
      showToast.error('Call failed. The spirits are not listening.');
    };

    s.on('incoming-call', onIncomingCall);
    s.on('call-accepted', onCallAccepted);
    s.on('call-rejected', onCallRejected);
    s.on('call-ended', onCallEnded);
    s.on('call-busy', onCallBusy);
    s.on('call-failed', onCallFailed);

    return () => {
      s.off('incoming-call', onIncomingCall);
      s.off('call-accepted', onCallAccepted);
      s.off('call-rejected', onCallRejected);
      s.off('call-ended', onCallEnded);
      s.off('call-busy', onCallBusy);
      s.off('call-failed', onCallFailed);
    };
  }, [socket, setCall, setAudioCall, setVideoCall, acceptCall, rejectCall, endCall]);
}
