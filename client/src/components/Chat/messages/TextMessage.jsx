"use client";
import React from "react";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "@/components/common/MessageStatus";
import { useAuthStore } from "@/stores/authStore";

function TextMessage({ message, isIncoming }) {
  const userInfo = useAuthStore((s) => s.userInfo);

  const messageBubbleClass = isIncoming
    ? "bg-ancient-bubble-user text-ancient-text-light"
    : "bg-ancient-bubble-other text-ancient-text-light";

  return (
    <div className={`message-bubble ${isIncoming ? 'message-bubble-incoming' : 'message-bubble-outgoing'} ${messageBubbleClass} max-w-[420px]`}>
      {/* Message content */}
      <div className="flex flex-col gap-2">
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
