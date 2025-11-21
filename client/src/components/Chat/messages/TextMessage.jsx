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
    <div className={`flex flex-col w-full max-w-[65%] sm:max-w-[70%] md:max-w-[65%] gap-1 ${isIncoming ? 'items-start' : 'items-end'}`}>
      {message.isForwarded && (
        <span className="text-[10px] text-ancient-text-muted italic px-2">Forwarded</span>
      )}
      <div className={`message-bubble ${isIncoming ? 'message-bubble-incoming' : 'message-bubble-outgoing'} ${messageBubbleClass}`}>
        {/* Message content */}
        <div className="flex flex-col gap-2">
          <span className="break-words leading-relaxed text-sm sm:text-base">{message.content || message.message}</span>
          
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
      
      {/* Reactions */}
      {Array.isArray(message.reactions) && message.reactions.length > 0 && (
        <div className="flex gap-2 text-xs mt-1 px-2 flex-wrap">
          {Object.entries(
            message.reactions.reduce((acc, r) => {
              const key = r.emoji || r;
              acc[key] = (acc[key] || 0) + 1;
              return acc;
            }, {})
          ).map(([emoji, count]) => (
            <span
              key={emoji}
              className="px-2 py-1 rounded-full bg-ancient-input-bg/60 border border-ancient-border-stone/40 shadow-sm backdrop-blur-sm text-[11px] sm:text-xs"
            >
              {emoji} {count > 1 && count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default TextMessage;
