/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState, useEffect } from "react";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "@/components/common/MessageStatus";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { FaImage } from "react-icons/fa";
import { RiShareForwardFill } from "react-icons/ri";
import dynamic from "next/dynamic";
import RepliedMessageQuote from "./RepliedMessageQuote";

const ChatMediaViewer = dynamic(
  () => import("@/components/chat/ChatMediaViewer"),
  { ssr: false }
);

function ImageMessage({ message, isIncoming }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const isGroup = currentChatUser?.isGroup || currentChatUser?.type === "group";
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const hasCaption = message.caption && message.caption.trim().length > 0;

  useEffect(() => {
    setImageLoaded(false);
  }, [message.content]);

  return (
    <>
      <div
        className={`
          message-bubble message-bubble-image
          ${isIncoming ? "message-bubble-incoming" : "message-bubble-outgoing"}
          p-[3px] max-w-[400px] sm:max-w-[460px]
        `}
      >
        {/* Group sender name (above image, visible) */}
        {isGroup && isIncoming && message.sender?.name && (
          <div className="text-[11px] font-bold text-ancient-icon-glow truncate px-1 pt-1 pb-0.5">
            {message.sender.name}
          </div>
        )}

        {/* Quoted reply (above image) */}
        {message.quotedMessage && (
          <div className="mb-1 w-full px-1 pt-1">
            <RepliedMessageQuote quotedMessage={message.quotedMessage} />
          </div>
        )}

        {/* Image container */}
        <div
          className="relative rounded-[10px] overflow-hidden cursor-pointer group bg-ancient-input-bg"
          onClick={() => setShowImageViewer(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setShowImageViewer(true);
            }
          }}
          aria-label="Open image preview"
        >
          {/* Loading skeleton */}
          {!imageLoaded && (
            <div
              className={`absolute inset-0 z-10 flex items-center justify-center min-h-[180px] animate-pulse ${isIncoming ? "bg-ancient-input-bg" : "bg-ancient-input-bg/60"
                }`}
            >
              <FaImage
                className={`text-4xl sm:text-5xl ${isIncoming ? "text-ancient-text-muted" : "text-ancient-icon-glow/50"
                  }`}
              />
            </div>
          )}

          <img
            src={message.content || message.message || ""}
            alt={hasCaption ? message.caption : "Sent image"}
            loading="lazy"
            className={`w-full h-auto max-h-[420px] object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />

          {/* Forwarded overlay — top left (only when image is visible) */}
          {message.isForwarded && imageLoaded && (
            <div className="absolute top-2 left-2 z-20 flex items-center gap-1 text-[11px] text-white/95 italic bg-black/50 rounded-full px-2 py-0.5 backdrop-blur-sm">
              <RiShareForwardFill className="text-[12px]" />
              <span>Forwarded</span>
            </div>
          )}

          {/* Caption gradient overlay */}
          {hasCaption && imageLoaded && (
            <div className="absolute bottom-0 left-0 right-0 px-3 pt-6 pb-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
              <p className="text-white text-[13px] leading-snug line-clamp-3">
                {message.caption}
              </p>
            </div>
          )}

          {/* Time + status badge — bottom right */}
          <div
            className={`absolute ${hasCaption && imageLoaded ? "bottom-8" : "bottom-2"
              } right-2 z-10 flex items-center gap-1 px-2 py-[3px] rounded-full bg-black/50 backdrop-blur-sm`}
          >
            <span className="text-[10px] text-white/90 tabular-nums font-medium">
              {calculateTime(message.timestamp || message.createdAt)}
            </span>
            {message.senderId === userInfo?.id && (
              <span className="drop-shadow">
                <MessageStatus status={message.messageStatus} />
              </span>
            )}
          </div>

          {/* Hover dim */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-colors duration-200 pointer-events-none" />
        </div>

        {/* Sparkles */}
        <div className="sparkles hidden sm:block" aria-hidden="true">
          <span className="sparkle sparkle-1">🖼️</span>
          <span className="sparkle sparkle-2">✨</span>
          <span className="sparkle sparkle-3">📸</span>
        </div>
      </div>

      {showImageViewer && (
        <ChatMediaViewer
          initialMediaId={message.id}
          onClose={() => setShowImageViewer(false)}
        />
      )}
    </>
  );
}

export default ImageMessage;
