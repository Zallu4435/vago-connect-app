"use client";
import React, { useCallback } from "react";
import Image from "next/image";
import { BsTelephoneInbound, BsTelephoneX, BsCameraVideo, BsCameraVideoOff } from "react-icons/bs";
import { FaMagic } from "react-icons/fa"; // Reliable mystical accent icon
import { useCallStore } from "@/stores/callStore";
import { useSocketStore } from "@/stores/socketStore";

/**
 * Reusable component for displaying incoming call notifications (audio or video).
 * Applies mystical theme and consistent UI.
 */
function IncomingCallNotification() {
  const call = useCallStore((s) => s.call);
  const socket = useSocketStore((s) => s.socket);

  // If no call or if the call object is incomplete, don't render.
  if (!call || !call.from || !call.callType) return null;

  const isVideoCall = call.callType === "video";
  const callerName = call?.from?.name || "Mysterious Caller";
  const callerImage = call?.from?.image || "/default_mystical_avatar.png";

  const handleAcceptCall = useCallback(() => {
    socket?.current?.emit?.("accept-call", { from: call.from.id, to: call.to.id });
    // You might want to clear the call state here or in a separate hook after acceptance
  }, [socket, call]);

  const handleRejectCall = useCallback(() => {
    socket?.current?.emit?.("reject-call", { from: call.from.id, to: call.to.id });
    // You might want to clear the call state here or in a separate hook after rejection
  }, [socket, call]);

  return (
    <div
      className="fixed bottom-8 right-6 z-50 p-4 w-96 rounded-xl bg-ancient-bg-medium border border-ancient-border-stone shadow-2xl
                 flex flex-col items-center gap-4 text-ancient-text-light animate-fade-in-down" // Using fade-in-down for subtle appearance
    >
      {/* Caller Info */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-20 w-20 rounded-full overflow-hidden flex-shrink-0 border-2 border-ancient-icon-glow shadow-md">
          <Image
            src={callerImage}
            alt={callerName}
            fill
            className="object-cover"
          />
        </div>
        <span className="text-xl font-bold text-ancient-text-light">{callerName}</span>
        <span className="text-ancient-text-muted text-sm">
          {isVideoCall ? (
            <> <FaMagic className="inline-block mr-1 text-ancient-icon-glow" /> Incoming Scrying Orb Vision</>
          ) : (
            <> <FaMagic className="inline-block mr-1 text-ancient-icon-glow" /> Incoming Whispered Invocation</>
          )}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-6 w-full mt-2">
        <button
          onClick={handleRejectCall}
          className="h-14 w-14 rounded-full bg-red-700/80 hover:bg-red-600 text-white flex items-center justify-center text-2xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          title="Reject Invocation"
          aria-label="Reject Call"
        >
          {isVideoCall ? <BsCameraVideoOff /> : <BsTelephoneX />}
        </button>
        <button
          onClick={handleAcceptCall}
          className="h-14 w-14 rounded-full bg-ancient-icon-glow hover:bg-green-500 text-ancient-bg-dark flex items-center justify-center text-2xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          title="Accept Invocation"
          aria-label="Accept Call"
        >
          {isVideoCall ? <BsCameraVideo /> : <BsTelephoneInbound />}
        </button>
      </div>
    </div>
  );
}

export default IncomingCallNotification;