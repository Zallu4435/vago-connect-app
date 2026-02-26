"use client";
import React, { useCallback } from "react";
import Image from "next/image";
import {
  BsTelephoneInbound, BsTelephoneX, BsCameraVideo, BsCameraVideoOff
} from "react-icons/bs";
import { useCallStore } from "@/stores/callStore";
import { useSocketStore } from "@/stores/socketStore";
import { callSession } from '@/hooks/calls/useCallSocketHandlers';

/**
 * IncomingCallNotification
 *
 * Shown on the callee side when calling=true and callAccepted=false.
 * Floats over the main layout.
 * Accepting: emits "accept-call" + flips audioCall/videoCall so Container mounts.
 * Rejecting: emits "reject-call" + resets call store.
 */
function IncomingCallNotification() {
  const call = useCallStore((s) => s.call);
  const socket = useSocketStore((s) => s.socket);
  const { acceptCall, rejectCall, endCall, setAudioCall, setVideoCall } = useCallStore.getState();

  const isVideoCall = call?.callType === "video";
  const callerName = call?.from?.name || "Unknown Caller";
  const callerImage = call?.from?.image || "/default_avatar.png";

  const handleAcceptCall = useCallback(() => {
    if (!socket?.current || !call?.from || !call?.to) return;
    socket.current.emit("accept-call", {
      from: call.from.id,
      to: call.to.id,
      callMessageId: callSession.callMessageId,
    });
    callSession.callStartTime = Date.now();
    acceptCall();
    if (isVideoCall) setVideoCall(true);
    else setAudioCall(true);
  }, [socket, call, acceptCall, isVideoCall, setVideoCall, setAudioCall]);

  const handleRejectCall = useCallback(() => {
    if (!socket?.current || !call?.from || !call?.to) return;
    socket.current.emit("reject-call", {
      from: call.from.id,
      to: call.to.id,
      callMessageId: callSession.callMessageId,
    });
    callSession.callMessageId = null;
    callSession.callStartTime = null;
    rejectCall();
    endCall();
  }, [socket, call, rejectCall, endCall]);

  if (!call || !call.from || !call.callType) return null;

  return (
    <div
      className="
        fixed z-[100]
        bottom-4 right-4 sm:bottom-6 sm:right-6
        p-4 sm:p-5 w-[92vw] max-w-[22rem]
        rounded-2xl bg-ancient-bg-medium/95 backdrop-blur-md
        border border-ancient-border-stone shadow-2xl
        flex flex-col items-center gap-4 text-ancient-text-light
        animate-fade-in-down
      "
      role="alertdialog"
      aria-label={`Incoming ${isVideoCall ? "video" : "audio"} call from ${callerName}`}
    >
      {/* Caller avatar */}
      <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden border-2 border-ancient-icon-glow shadow-md flex-shrink-0">
        <Image
          src={callerImage}
          alt={callerName}
          fill
          className="object-cover"
          priority
        />
        {/* Pulsing ring */}
        <div className="absolute inset-0 rounded-full border-2 border-ancient-icon-glow/50 animate-ping pointer-events-none" />
      </div>

      {/* Name + call type */}
      <div className="text-center">
        <p className="text-base sm:text-lg font-bold truncate max-w-[200px]">{callerName}</p>
        <p className="text-ancient-text-muted text-xs sm:text-sm mt-0.5">
          {isVideoCall ? "Incoming video call" : "Incoming voice call"}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-6 w-full">
        {/* Reject */}
        <button
          onClick={handleRejectCall}
          aria-label="Reject call"
          title="Decline"
          className="
            h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-red-600 hover:bg-red-500
            flex items-center justify-center text-white text-xl sm:text-2xl
            transition-all active:scale-90 shadow-lg
          "
        >
          {isVideoCall ? <BsCameraVideoOff /> : <BsTelephoneX />}
        </button>

        {/* Accept */}
        <button
          onClick={handleAcceptCall}
          aria-label="Accept call"
          title="Answer"
          className="
            h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-ancient-icon-glow hover:brightness-110
            flex items-center justify-center text-ancient-bg-dark text-xl sm:text-2xl
            transition-all active:scale-90 shadow-lg animate-bounce-subtle
          "
        >
          {isVideoCall ? <BsCameraVideo /> : <BsTelephoneInbound />}
        </button>
      </div>
    </div>
  );
}

export default IncomingCallNotification;
