"use client";
import React from "react";
import BaseVoicePlayer from "@/components/common/BaseVoicePlayer";
import { useChatStore } from "@/stores/chatStore";

function AudioMessage({ message, isIncoming }) {
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const leftAvatar = isIncoming ? (message?.sender?.profileImage || "/default_mystical_avatar.png") : undefined;
  const rightAvatar = !isIncoming ? (message?.sender?.profileImage || "/default_mystical_avatar.png") : undefined;
  
  return (
    <div className={`flex flex-col w-full max-w-[70%] sm:max-w-[65%] gap-1 ${isIncoming ? 'items-start' : 'items-end'}`}>
      {message.isForwarded && (
        <span className="text-[10px] text-ancient-text-muted italic px-2">Forwarded</span>
      )}
      
      <div className={`message-bubble message-bubble-audio ${isIncoming ? 'message-bubble-incoming' : 'message-bubble-outgoing'}`}>
        <BaseVoicePlayer
          src={message?.content}
          isIncoming={isIncoming}
          showAvatars={Boolean(message?.sender)}
          leftAvatarUrl={leftAvatar}
          rightAvatarUrl={rightAvatar}
        />
        
        {/* Sparkle particles */}
        <div className="sparkles hidden sm:block" aria-hidden="true">
          <span className="sparkle sparkle-1">🎵</span>
          <span className="sparkle sparkle-2">🎶</span>
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

export default AudioMessage;
