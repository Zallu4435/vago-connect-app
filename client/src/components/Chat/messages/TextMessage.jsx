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
  const isGroup = currentChatUser?.isGroup || currentChatUser?.type === 'group';

  const messageBubbleClass = isIncoming
    ? "bg-ancient-bubble-user text-ancient-text-light"
    : "bg-ancient-bubble-other text-ancient-text-light";

  return (
    <div className={`message-bubble ${isIncoming ? 'message-bubble-incoming' : 'message-bubble-outgoing'} ${messageBubbleClass} max-w-[420px]`}>
      {/* Message content */}
      <div className="flex flex-col gap-2">
        {isGroup && isIncoming && message.sender?.name && (
          <div className="text-[11px] sm:text-[12px] font-bold text-ancient-text-muted opacity-90 truncate -mb-1">
            ~ {message.sender.name}
          </div>
        )}
        {message.isForwarded && (
          <div className="flex items-center gap-1 text-[11px] sm:text-[12px] text-ancient-text-muted mb-1 italic">
            <RiShareForwardFill />
            <span>Forwarded</span>
          </div>
        )}
        <RepliedMessageQuote quotedMessage={message.quotedMessage} />
        <span className="break-words leading-relaxed text-sm sm:text-base">
          {message.content || message.message}
        </span>

        {/* Time and status row */}
        <div className="flex gap-2 items-center justify-end mt-1 flex-wrap">
          <span className="text-ancient-text-muted text-[10px] sm:text-[11px] whitespace-nowrap">
            {calculateTime(message.timestamp || message.createdAt)}
          </span>
          {message.isEdited && (
            <span className="text-ancient-text-muted text-[9px] sm:text-[10px] italic">(altered)</span>
          )}
          {message.senderId === userInfo.id && (
            <span className="flex-shrink-0">
              <MessageStatus status={message.messageStatus ?? message.status} />
            </span>
          )}
        </div>
      </div>

      {/* Sparkle particles - hidden on very small screens */}
      <div className="sparkles hidden sm:block" aria-hidden="true">
        <span className="sparkle sparkle-1">✨</span>
        <span className="sparkle sparkle-2">✨</span>
        <span className="sparkle sparkle-3">✨</span>
      </div>
    </div>
  );
}

export default TextMessage;
