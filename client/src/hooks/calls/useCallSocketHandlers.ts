"use client";
import { useEffect, useRef } from 'react';
import { useSocketStore } from '@/stores/socketStore';
import { useCallStore } from '@/stores/callStore';
import { showToast } from '@/lib/toast';

/**
 * Global call session tracking (refs survive re-renders without triggering them)
 * Exported so useWebRTC can read callMessageId + callStartTime when hanging up.
 */
export const callSession = {
  callMessageId: null,   // number | null — DB message id for the current call
  callStartTime: null,   // Date.now() ms when call was accepted
};

/**
 * useCallSocketHandlers
 *
 * Listens for all call-related socket events and updates the call store.
 *
 * Flow (Caller side):
 *  1. ChatHeader emits "call-user" + calls initiateCall() → audioCall/videoCall=true → Container mounts
 *  2. Server creates DB message → emits "incoming-call" to callee with callMessageId
 *  3. Callee accepts → "call-accepted" → acceptCall() → isCaller useWebRTC starts offer
 *  4. Call ends: caller emits "end-call" + { callMessageId, duration }
 *
 * Flow (Callee side):
 *  1. "incoming-call" → setCall(data) + store callMessageId → IncomingCallNotification shows
 *  2. Callee taps Accept → emits "accept-call" + acceptCall() + sets audioCall/videoCall
 *  3. WebRTC media flows
 *  4. Call ends: callee emits "end-call" + { callMessageId, duration }
 */
export function useCallSocketHandlers() {
  const socket = useSocketStore((s) => s.socket);

  const {
    setCall,
    setAudioCall,
    setVideoCall,
    acceptCall,
    rejectCall,
    endCall,
  } = useCallStore.getState();

  useEffect(() => {
    const s = socket?.current;
    if (!s) return;

    // ── Incoming call ──────────────────────────────────────────────────────
    const onIncomingCall = (data: any) => {
      // Store the DB message id for this call session
      callSession.callMessageId = data?.callMessageId ?? null;
      callSession.callStartTime = null;

      // Only set call metadata + calling=true; DO NOT flip audioCall/videoCall yet.
      // IncomingCallNotification will render over the main layout.
      setCall(data);
      useCallStore.setState({ calling: true });
    };

    // ── Caller: remote accepted ────────────────────────────────────────────
    const onCallAccepted = () => {
      callSession.callStartTime = Date.now(); // start timer
      acceptCall(); // callAccepted=true → useWebRTC creates offer
    };

    // ── Caller: remote rejected ────────────────────────────────────────────
    const onCallRejected = () => {
      callSession.callMessageId = null;
      callSession.callStartTime = null;
      rejectCall();
      endCall();
      showToast.info('Call was declined.');
    };

    // ── Either side: call ended (from remote) ──────────────────────────────
    const onCallEnded = () => {
      callSession.callMessageId = null;
      callSession.callStartTime = null;
      endCall();
    };

    // ── Call failed / busy ─────────────────────────────────────────────────
    const onCallFailed = (payload: any) => {
      callSession.callMessageId = null;
      callSession.callStartTime = null;
      endCall();
      showToast.error(
        payload?.reason === 'offline'
          ? 'User is not online right now.'
          : 'Call failed. Please try again.'
      );
    };

    const onCallBusy = () => {
      showToast.error("Call busy: Remote user is already in another call");
      callSession.callStartTime = null;
      endCall();
      showToast.info('The user is currently busy.');
    };

    s.on('incoming-call', onIncomingCall);
    s.on('call-accepted', onCallAccepted);
    s.on('call-rejected', onCallRejected);
    s.on('call-ended', onCallEnded);
    s.on('call-failed', onCallFailed);
    s.on('call-busy', onCallBusy);

    return () => {
      s.off('incoming-call', onIncomingCall);
      s.off('call-accepted', onCallAccepted);
      s.off('call-rejected', onCallRejected);
      s.off('call-ended', onCallEnded);
      s.off('call-failed', onCallFailed);
      s.off('call-busy', onCallBusy);
    };
  }, [socket, setCall, setAudioCall, setVideoCall, acceptCall, rejectCall, endCall]);
}
