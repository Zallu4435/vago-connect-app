"use client";
import React, { useCallback } from "react";
import Image from "next/image";
import {
  BsTelephoneInbound, BsTelephoneX, BsCameraVideo, BsCameraVideoOff
} from "react-icons/bs";
import { FaMagic } from "react-icons/fa";
import { useCallStore } from "@/stores/callStore";
import { useSocketStore } from "@/stores/socketStore";

/**
 * Responsive and themed incoming call notification component.
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
  }, [socket, call]);

  const handleRejectCall = useCallback(() => {
    socket?.current?.emit?.("reject-call", { from: call.from.id, to: call.to.id });
  }, [socket, call]);

  return (
    <div
      className={`
        fixed z-50
        bottom-2 sm:bottom-6 right-1 sm:right-6
        p-2 sm:p-4 w-[94vw] max-w-[22rem] sm:w-96
        rounded-xl bg-ancient-bg-medium border border-ancient-border-stone shadow-2xl
        flex flex-col items-center gap-3 sm:gap-4 text-ancient-text-light
        animate-fade-in-down
      `}
      style={{ boxSizing: "border-box" }}
    >
      {/* Caller Info */}
      <div className="flex flex-col items-center gap-2 sm:gap-3">
        <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden flex-shrink-0 border-2 border-ancient-icon-glow shadow-md">
          <Image
            src={callerImage}
            alt={callerName}
            fill
            className="object-cover"
            priority
          />
        </div>
        <span className="text-lg sm:text-xl font-bold text-ancient-text-light text-center truncate w-full">
          {callerName}
        </span>
        <span className="text-ancient-text-muted text-xs sm:text-sm text-center flex items-center gap-1">
          <FaMagic className="inline-block text-ancient-icon-glow text-base sm:text-lg" />
          {isVideoCall ? "Incoming Scrying Orb Vision" : "Incoming Whispered Invocation"}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 w-full mt-1 sm:mt-2">
        <button
          onClick={handleRejectCall}
          className="
            h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-red-700/80 hover:bg-red-600
            text-white flex items-center justify-center text-xl sm:text-2xl
            transition-all duration-200 transform hover:scale-105 shadow-lg
            focus:outline-none
          "
          title="Reject Invocation"
          aria-label="Reject Call"
        >
          {isVideoCall ? <BsCameraVideoOff /> : <BsTelephoneX />}
        </button>
        <button
          onClick={handleAcceptCall}
          className="
            h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-ancient-icon-glow hover:bg-green-500
            text-ancient-bg-dark flex items-center justify-center text-xl sm:text-2xl
            transition-all duration-200 transform hover:scale-105 shadow-lg
            focus:outline-none
          "
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
