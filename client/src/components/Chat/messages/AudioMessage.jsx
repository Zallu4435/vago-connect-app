"use client";
import React from "react";
import BaseVoicePlayer from "@/components/common/BaseVoicePlayer";

function AudioMessage({ message, isIncoming }) {
  return (
    <div className={`message-bubble message-bubble-audio ${isIncoming ? 'message-bubble-incoming' : 'message-bubble-outgoing'} min-w-[280px] max-w-[420px]`}>
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
