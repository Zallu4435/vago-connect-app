"use client";
import React from "react";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "@/components/common/MessageStatus";
import RepliedMessageQuote from "./RepliedMessageQuote";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { RiShareForwardFill } from "react-icons/ri";

function TextMessage({ message, isIncoming }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const isGroup = currentChatUser?.isGroup || currentChatUser?.type === "group";

  const bubbleClass = isIncoming
    ? "bg-ancient-bubble-user text-ancient-text-light"
    : "bg-ancient-bubble-other text-ancient-text-light";

  return (
    <div
      className={`
        message-bubble
        ${isIncoming ? "message-bubble-incoming" : "message-bubble-outgoing"}
        ${bubbleClass}
        max-w-[420px] sm:max-w-[480px]
      `}
    >
      <div className="flex flex-col gap-[6px]">

        {/* Group sender name */}
        {isGroup && isIncoming && message.sender?.name && (
          <div className="text-[11px] font-bold text-ancient-icon-glow truncate leading-none">
            {message.sender.name}
          </div>
        )}

        {/* Forwarded banner */}
        {message.isForwarded && (
          <div className="flex items-center gap-1 text-[11px] text-ancient-text-muted italic border-l-2 border-ancient-text-muted/40 pl-2 -ml-1">
            <RiShareForwardFill className="text-[12px] flex-shrink-0" />
            <span>Forwarded</span>
          </div>
        )}

        {/* Quoted reply */}
        <RepliedMessageQuote quotedMessage={message.quotedMessage} />

        {/* Message text */}
        <span className="break-words leading-relaxed text-[14px] sm:text-[15px]">
          {message.content || message.message}
        </span>

        {/* Time + status */}
        <div className="flex gap-1.5 items-center justify-end mt-0.5">
          {message.isEdited && (
            <span className="text-ancient-text-muted text-[10px] italic">Edited</span>
          )}
          <span className="text-ancient-text-muted text-[10px] whitespace-nowrap tabular-nums">
            {calculateTime(message.timestamp || message.createdAt)}
          </span>
          {message.senderId === userInfo?.id && (
            <span className="flex-shrink-0">
              <MessageStatus status={message.messageStatus ?? message.status} />
            </span>
          )}
        </div>
      </div>

      {/* Sparkles */}
      <div className="sparkles hidden sm:block" aria-hidden="true">
        <span className="sparkle sparkle-1">✨</span>
        <span className="sparkle sparkle-2">✨</span>
        <span className="sparkle sparkle-3">✨</span>
      </div>
    </div>
  );
}

export default TextMessage;
