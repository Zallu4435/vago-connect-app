import React from "react";
import Image from "next/image";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "../common/MessageStatus";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";

function ImageMessage({ message }) {
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const userInfo = useAuthStore((s) => s.userInfo);

  return (
    <div
      className={`p-1 rounded-lg ${message.senderId === currentChatUser.id
          ? "bg-incoming-background"
          : "bg-outgoing-background"
        }`}
    >
      <div className="relative">
        <Image src={message.content} className="rounded-lg" alt="asset" height={300} width={300} />
        <div className="absolute bottom-1 right-1 flex items-end gap-1">
          <span className="text-bubble-meta text-[11px] pt-1 min-w-fit">
            {calculateTime(message.timestamp)}
          </span>
          <span>
            {message.senderId === userInfo.id && <MessageStatus MessageStatus={message.messageStatus} />}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ImageMessage;
