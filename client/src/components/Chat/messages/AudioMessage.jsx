"use client";
import React from "react";
import BaseVoicePlayer from "@/components/common/BaseVoicePlayer";
import RepliedMessageQuote from "./RepliedMessageQuote";
import { useChatStore } from "@/stores/chatStore";
import { RiShareForwardFill } from "react-icons/ri";

function AudioMessage({ message, isIncoming }) {
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const isGroup = currentChatUser?.isGroup || currentChatUser?.type === 'group';

  return (
    <div className={`message-bubble message-bubble-audio ${isIncoming ? 'message-bubble-incoming' : 'message-bubble-outgoing'} min-w-[280px] max-w-[420px]`}>
      {isGroup && isIncoming && message.sender?.name && (
        <div className="text-[11px] sm:text-[12px] font-bold text-ancient-text-muted opacity-90 truncate mb-1">
          ~ {message.sender.name}
        </div>
      )}
      {message.isForwarded && (
        <div className="flex items-center gap-1 text-[11px] sm:text-[12px] text-ancient-text-muted mb-1 italic">
          <RiShareForwardFill />
          <span>Forwarded</span>
        </div>
      )}
      {message.quotedMessage && (
        <div className="mb-2 w-full max-w-[420px]">
          <RepliedMessageQuote quotedMessage={message.quotedMessage} />
        </div>
      )}
      <BaseVoicePlayer
        src={message?.content}
        isIncoming={isIncoming}
      />

      {/* Sparkle particles */}
      <div className="sparkles hidden sm:block" aria-hidden="true">
        <span className="sparkle sparkle-1">🎵</span>
        <span className="sparkle sparkle-2">🎶</span>
        <span className="sparkle sparkle-3">✨</span>
      </div>
    </div>
  );
}

export default AudioMessage;
