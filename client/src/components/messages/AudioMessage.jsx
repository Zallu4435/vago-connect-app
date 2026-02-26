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
    <div className={`message-bubble message-bubble-audio ${isIncoming ? 'message-bubble-incoming' : 'message-bubble-outgoing'} min-w-[240px] max-w-[360px]`}>
      {message.quotedMessage && (
        <div className="mb-2 w-full max-w-[420px]">
          <RepliedMessageQuote quotedMessage={message.quotedMessage} />
        </div>
      )}
      <BaseVoicePlayer
        src={message?.content}
        isIncoming={isIncoming}
        isForwarded={!!message.isForwarded}
        senderName={isGroup && isIncoming ? message.sender?.name : undefined}
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
