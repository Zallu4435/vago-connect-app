import React from "react";
import Image from "next/image";
import { MdOutlineCallEnd } from "react-icons/md";
import { BsTelephoneInbound, BsTelephoneX } from "react-icons/bs";
import { FaCircle, FaMagic } from "react-icons/fa"; // Reliable mystical icons
import { useSocketStore } from "@/stores/socketStore";
import { useCallStore } from "@/stores/callStore";
import { showToast } from "@/lib/toast";

let callToastId = null;
const showCallToast = (fn) => {
  if (callToastId) {
    showToast.dismiss(callToastId);
    callToastId = null;
  }
  callToastId = fn();
};

function Container({ data }) {
  const socket = useSocketStore((s) => s.socket);
  const callAccepted = useCallStore((s) => s.callAccepted);
  const acceptCall = useCallStore((s) => s.acceptCall);
  const rejectCall = useCallStore((s) => s.rejectCall);
  const endCallStore = useCallStore((s) => s.endCall);

  const onEnd = () => {
    socket?.current?.emit?.("end-call", { to: data?.from?.id || data?.to?.id });
    endCallStore();
    showCallToast(() => showToast.info("The ethereal connection has been severed.")); // Themed
  };

  const onAccept = () => {
    acceptCall();
    socket?.current?.emit?.("accept-call", { from: data?.from?.id, to: data?.to?.id });
    showCallToast(() => showToast.success("Ethereal connection established.")); // Themed
  };

  const onReject = () => {
    rejectCall();
    socket?.current?.emit?.("reject-call", { from: data?.from?.id, to: data?.to?.id });
    endCallStore();
    showCallToast(() => showToast.info("The ancient plea was declined.")); // Themed
  };

  const callPurpose = data?.callType === "audio" ? "Voice Incantation" : "Scrying Vision"; // Themed
  const peer = data?.from || data?.to || {};
  const image = peer?.image || "/default_mystical_avatar.png"; // Changed default avatar
  const name = peer?.name || "Unknown Spirit"; // Themed name for unknown

  return (
    <div className="fixed inset-0 z-50 bg-ancient-bg-dark flex flex-col h-screen w-screen items-center justify-center overflow-hidden text-ancient-text-light animate-fade-in backdrop-blur-md">
      {/* Mystical Orb / Call Status */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
        <FaCircle
          className={`text-[30rem] ${
            callAccepted ? 'text-ancient-icon-glow animate-pulse-light-slow' : 'text-ancient-text-muted opacity-30 animate-spin-slow'
          } transition-colors duration-1000`}
        />
      </div>

      <div className="flex flex-col gap-6 items-center justify-center z-10 p-8 bg-ancient-bg-medium/80 backdrop-blur-sm rounded-xl border border-ancient-border-stone shadow-2xl animate-zoom-in">
        <span className="text-6xl font-serif font-bold text-ancient-icon-glow drop-shadow-lg text-center leading-tight">
          {name}
        </span>
        <span className="text-xl italic text-ancient-text-muted">
          {callAccepted ? `Conducting ${callPurpose}` : `Incoming ${callPurpose}`}
        </span>

        {/* Themed Avatar */}
        <div className="relative mb-8 mt-4 animate-float">
          <Image
            src={image}
            alt={name}
            width={220}
            height={220}
            className="rounded-full object-cover border-4 border-ancient-icon-glow shadow-xl transform group-hover:scale-105 transition-transform duration-300"
          />
          <FaMagic className="absolute -bottom-2 -right-2 text-6xl text-ancient-icon-glow animate-spin-slow-reverse drop-shadow-md" />
        </div>

        {/* Call Controls */}
        <div className="flex items-center gap-10">
          {!callAccepted && (
            <>
              {/* Accept Call */}
              <button
                onClick={onAccept}
                className="h-20 w-20 rounded-full bg-ancient-icon-glow flex items-center justify-center shadow-xl hover:scale-110 transition-all duration-300 animate-bounce-subtle"
                title="Answer Incantation"
              >
                <BsTelephoneInbound className="text-3xl text-ancient-bg-dark" />
              </button>
              {/* Reject Call */}
              <button
                onClick={onReject}
                className="h-20 w-20 rounded-full bg-red-700 flex items-center justify-center shadow-xl hover:scale-110 transition-all duration-300"
                title="Decline Plea"
              >
                <BsTelephoneX className="text-3xl text-white" />
              </button>
            </>
          )}
          {/* End Call */}
          <button
            onClick={onEnd}
            className={`h-20 w-20 rounded-full bg-red-700 flex items-center justify-center shadow-xl hover:scale-110 transition-all duration-300 ${callAccepted ? "" : "ml-0"}`} // Adjust margin if only end button is present
            title="Sever Connection"
          >
            <MdOutlineCallEnd className="text-4xl text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Container;