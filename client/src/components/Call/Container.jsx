import React from "react";
import Image from "next/image";
import { MdOutlineCallEnd } from "react-icons/md";
import { BsTelephoneInbound, BsTelephoneX } from "react-icons/bs";
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
    showCallToast(() => showToast.info("Call ended"));
  };

  const onAccept = () => {
    acceptCall();
    socket?.current?.emit?.("accept-call", { from: data?.from?.id, to: data?.to?.id });
    showCallToast(() => showToast.success("Call connected"));
  };

  const onReject = () => {
    rejectCall();
    socket?.current?.emit?.("reject-call", { from: data?.from?.id, to: data?.to?.id });
    endCallStore();
    showCallToast(() => showToast.info("Call declined"));
  };

  const title = data?.callType === "audio" ? "Voice call" : "Video call";
  const peer = data?.from || data?.to || {};
  const image = peer?.image || "/default_avatar.png";
  const name = peer?.name || "Unknown";

  return (
    <div className="border-1 border-conversation-border w-full bg-conversation-panel-background flex flex-col h-[100vh] items-center justify-center overflow-hidden text-white">
      <div className="flex flex-col gap-3 items-center mb-6">
        <span className="text-5xl">{name}</span>
        <span className="text-lg">{callAccepted ? `On going ${title}` : `Incoming ${title}`}</span>
      </div>

      <div className="mb-8">
        <Image
          src={image}
          alt={name}
          width={200}
          height={200}
          className="rounded-full object-cover"
        />
      </div>

      <div className="flex items-center gap-6">
        {!callAccepted && (
          <>
            <button onClick={onAccept} className="h-14 w-14 rounded-full bg-[#25d366] flex items-center justify-center">
              <BsTelephoneInbound className="text-xl text-[#111b21]" />
            </button>
            <button onClick={onReject} className="h-14 w-14 rounded-full bg-red-600 flex items-center justify-center">
              <BsTelephoneX className="text-xl" />
            </button>
          </>
        )}
        <button onClick={onEnd} className="h-14 w-14 rounded-full bg-red-600 flex items-center justify-center">
          <MdOutlineCallEnd className="text-2xl" />
        </button>
      </div>
    </div>
  );
}

export default Container;
  