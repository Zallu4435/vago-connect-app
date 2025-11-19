import React from "react";
import Image from "next/image";
import { useStateProvider } from "@/context/StateContext";
import { BsTelephoneInbound, BsTelephoneX } from "react-icons/bs";

function IncomingCall() {
  const [{ call, socket }] = useStateProvider();
  if (!call || call.callType !== "audio") return null;

  const acceptCall = () => {
    socket?.current?.emit?.("accept-call", { from: call?.from?.id, to: call?.to?.id });
  };

  const rejectCall = () => {
    socket?.current?.emit?.("reject-call", { from: call?.from?.id, to: call?.to?.id });
  };

  return (
    <div className="h-24 w-80 fixed bottom-8 right-6 z-50 rounded-md bg-white flex items-center justify-between px-4 gap-3 shadow-lg">
      <div className="flex items-center gap-3">
        <Image 
          src={call?.from?.image || "/default_avatar.png"}
          alt={call?.from?.name || "Caller"}
          width={48}
          height={48}
          className="rounded-full object-cover"
        />
        <div className="flex flex-col">
          <span className="text-[#111b21] text-sm font-semibold">{call?.from?.name}</span>
          <span className="text-[#667781] text-xs">Incoming voice call</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={acceptCall} className="h-9 w-9 rounded-full bg-[#25d366] flex items-center justify-center" title="Accept">
          <BsTelephoneInbound className="text-[#111b21]" />
        </button>
        <button onClick={rejectCall} className="h-9 w-9 rounded-full bg-red-600 text-white flex items-center justify-center" title="Reject">
          <BsTelephoneX />
        </button>
      </div>
    </div>
  )
}

export default IncomingCall;
