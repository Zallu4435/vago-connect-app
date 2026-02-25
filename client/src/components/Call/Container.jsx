"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  MdOutlineCallEnd,
  MdMic, MdMicOff,
  MdVideocam, MdVideocamOff,
} from "react-icons/md";
import { BsTelephoneInbound, BsTelephoneX } from "react-icons/bs";
import { useSocketStore } from "@/stores/socketStore";
import { useCallStore } from "@/stores/callStore";
import { useAuthStore } from "@/stores/authStore";
import { useWebRTC } from "@/hooks/useWebRTC";
import { callSession } from "@/hooks/useCallSocketHandlers";

// ── Call duration timer ────────────────────────────────────────────────────
function useCallTimer(active) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) { setSeconds(0); return; }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

// ── Determine which user is which ─────────────────────────────────────────
function Container({ data }) {
  const socket = useSocketStore((s) => s.socket);
  const callAccepted = useCallStore((s) => s.callAccepted);
  const rejectCallStore = useCallStore((s) => s.rejectCall);
  const endCallStore = useCallStore((s) => s.endCall);
  const userInfo = useAuthStore((s) => s.userInfo);

  const isCaller = String(userInfo?.id) === String(data?.from?.id);
  const isVideoCall = data?.callType === "video";

  const peer = isCaller ? (data?.to ?? {}) : (data?.from ?? {});
  const peerName = peer?.name || "Unknown";
  const peerImage = peer?.image || "/default_avatar.png";

  const {
    localVideoRef,
    remoteVideoRef,
    isMuted,
    isCameraOff,
    remoteMuted,
    remoteCameraOff,
    toggleMute,
    toggleCamera,
    hangUp,
    connectionState,
  } = useWebRTC(data, isCaller);

  const timer = useCallTimer(callAccepted && connectionState === "connected");

  // ── Callee: accept — only used when Container shows before IncomingCallNotification
  //    (shouldn't normally happen, but defensive)
  const onAccept = () => {
    socket?.current?.emit("accept-call", {
      from: data?.from?.id,
      to: data?.to?.id,
      callMessageId: callSession.callMessageId,
    });
    callSession.callStartTime = Date.now();
    useCallStore.getState().acceptCall();
  };

  // ── Callee: reject
  const onReject = () => {
    socket?.current?.emit("reject-call", {
      from: data?.from?.id,
      to: data?.to?.id,
      callMessageId: callSession.callMessageId,
    });
    callSession.callMessageId = null;
    callSession.callStartTime = null;
    rejectCallStore();
    endCallStore();
  };

  // ── Status label ─────────────────────────────────────────────────────────
  const statusLabel = (() => {
    if (!callAccepted) return isCaller ? "Calling…" : "Incoming call";
    if (connectionState === "new" || connectionState === "connecting") return "Connecting…";
    if (connectionState === "connected") return timer;
    if (connectionState === "failed") return "Connection failed";
    if (connectionState === "disconnected") return "Reconnecting…";
    return timer;
  })();

  const isConnected = connectionState === "connected";

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-ancient-bg-dark text-ancient-text-light animate-fade-in select-none">

      {/* ── Video call ──────────────────────────────────────────────────── */}
      {isVideoCall ? (
        <div className="relative flex-1 bg-black overflow-hidden">

          {/* Remote video — fills screen */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Pre-connect / camera-off placeholder */}
          {(!isConnected || remoteCameraOff) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ancient-bg-dark/90 z-10">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-ancient-icon-glow shadow-2xl">
                <Image src={peerImage} alt={peerName} fill className="object-cover" priority />
              </div>
              <p className="text-2xl sm:text-3xl font-bold">{peerName}</p>
              <p className="text-ancient-text-muted text-sm animate-pulse">{statusLabel}</p>
              {remoteCameraOff && isConnected && (
                <p className="text-xs text-ancient-text-muted flex items-center gap-1">
                  <MdVideocamOff className="text-base" /> Camera is off
                </p>
              )}
            </div>
          )}

          {/* Remote muted indicator (top-left) */}
          {remoteMuted && isConnected && (
            <div className="absolute top-4 left-4 z-20 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 text-xs text-white">
              <MdMicOff className="text-sm text-red-400" /> Muted
            </div>
          )}

          {/* Timer (top-center) */}
          {isConnected && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium z-20">
              {timer}
            </div>
          )}

          {/* Local PiP — bottom-right */}
          <div className="absolute bottom-24 right-4 w-28 sm:w-36 aspect-video rounded-xl overflow-hidden border-2 border-ancient-border-stone shadow-xl z-20 bg-black">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            {isCameraOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-ancient-bg-dark">
                <MdVideocamOff className="text-3xl text-ancient-text-muted" />
              </div>
            )}
          </div>
        </div>

      ) : (
        /* ── Audio call ─────────────────────────────────────────────────── */
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <div className="relative">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-ancient-icon-glow shadow-2xl">
              <Image src={peerImage} alt={peerName} fill className="object-cover" priority />
            </div>
            {/* Pulsing ring when connected */}
            {isConnected && (
              <div className="absolute inset-0 rounded-full border-4 border-ancient-icon-glow/30 animate-ping pointer-events-none" />
            )}
            {/* Remote muted badge */}
            {remoteMuted && isConnected && (
              <div className="absolute -bottom-1 right-0 bg-red-600 rounded-full p-1.5 shadow-lg">
                <MdMicOff className="text-white text-sm" />
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold">{peerName}</p>
            <p className={`text-sm mt-1 ${isConnected ? "text-ancient-icon-glow" : "text-ancient-text-muted animate-pulse"}`}>
              {statusLabel}
            </p>
          </div>

          {/* Hidden audio for remote stream */}
          <audio ref={remoteVideoRef} autoPlay playsInline className="hidden" />
        </div>
      )}

      {/* ── Control bar ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-center gap-4 sm:gap-6 py-5 px-6 bg-black/30 backdrop-blur-sm border-t border-ancient-border-stone/20">

        {/* Mute */}
        <button
          onClick={toggleMute}
          title={isMuted ? "Unmute" : "Mute"}
          aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg ${isMuted
              ? "bg-red-700/80 text-white"
              : "bg-ancient-input-bg text-ancient-text-light hover:bg-ancient-input-border"
            }`}
        >
          {isMuted ? <MdMicOff className="text-xl sm:text-2xl" /> : <MdMic className="text-xl sm:text-2xl" />}
        </button>

        {/* Camera toggle (video only) */}
        {isVideoCall && (
          <button
            onClick={toggleCamera}
            title={isCameraOff ? "Turn camera on" : "Turn camera off"}
            aria-label={isCameraOff ? "Enable camera" : "Disable camera"}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg ${isCameraOff
                ? "bg-red-700/80 text-white"
                : "bg-ancient-input-bg text-ancient-text-light hover:bg-ancient-input-border"
              }`}
          >
            {isCameraOff ? <MdVideocamOff className="text-xl sm:text-2xl" /> : <MdVideocam className="text-xl sm:text-2xl" />}
          </button>
        )}

        {/* Accept (callee only, before accepted) */}
        {!isCaller && !callAccepted && (
          <button
            onClick={onAccept}
            title="Accept call"
            aria-label="Accept call"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-ancient-icon-glow flex items-center justify-center shadow-xl hover:brightness-110 active:scale-90 transition-all"
          >
            <BsTelephoneInbound className="text-2xl text-ancient-bg-dark" />
          </button>
        )}

        {/* End / Reject */}
        <button
          onClick={!isCaller && !callAccepted ? onReject : hangUp}
          title="End call"
          aria-label="End call"
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-xl active:scale-90 transition-all"
        >
          {!isCaller && !callAccepted
            ? <BsTelephoneX className="text-2xl text-white" />
            : <MdOutlineCallEnd className="text-2xl text-white" />}
        </button>
      </div>
    </div>
  );
}

export default Container;