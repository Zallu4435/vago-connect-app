"use client";
import React, { useState, useEffect } from "react";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "@/components/common/MessageStatus";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import dynamic from "next/dynamic";
import RepliedMessageQuote from "./RepliedMessageQuote";
import { RiShareForwardFill } from "react-icons/ri";
import { FaPlay, FaVideo } from "react-icons/fa";

const ChatMediaViewer = dynamic(
  () => import("@/components/chat/ChatMediaViewer"),
  { ssr: false }
);

function VideoMessage({ message, isIncoming }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const isGroup = currentChatUser?.isGroup || currentChatUser?.type === "group";
  const [loaded, setLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const hasCaption =
    typeof message?.caption === "string" && message.caption.trim().length > 0;

  useEffect(() => {
    setLoaded(false);
  }, [message?.content]);



  return (
    <>
      <div
        className={`
          message-bubble message-bubble-video
          ${isIncoming ? "message-bubble-incoming" : "message-bubble-outgoing"}
          max-w-[460px] sm:max-w-[500px]
        `}
      >
        {/* Group sender name */}
        {isGroup && isIncoming && message.sender?.name && (
          <div className="text-[11px] font-bold text-ancient-icon-glow truncate px-0 pb-1">
            {message.sender.name}
          </div>
        )}

        {/* Quoted reply */}
        {message.quotedMessage && (
          <div className="mb-1 w-full">
            <RepliedMessageQuote quotedMessage={message.quotedMessage} />
          </div>
        )}

        {/* Video container */}
        <div
          className={`
            relative rounded-xl overflow-hidden cursor-pointer group
            shadow-lg hover:shadow-xl transition-all duration-200
            ${isIncoming
              ? "bg-ancient-input-bg border border-ancient-input-border"
              : "bg-ancient-input-bg/80 border border-ancient-icon-glow/25"
            }
          `}
          role="button"
          tabIndex={0}
          aria-label="Open video preview"
          onClick={() => setShowPreview(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setShowPreview(true);
            }
          }}
        >
          {/* Forwarded overlay */}
          {message.isForwarded && (
            <div className="absolute top-2 left-2 z-20 flex items-center gap-1 text-[11px] text-white/95 italic bg-black/50 rounded-full px-2 py-0.5 backdrop-blur-sm">
              <RiShareForwardFill className="text-[12px]" />
              <span>Forwarded</span>
            </div>
          )}

          {/* Loading skeleton */}
          {!loaded && (
            <div
              className={`flex flex-col items-center justify-center w-full min-h-[200px] sm:min-h-[260px] animate-pulse ${isIncoming ? "bg-ancient-input-bg" : "bg-ancient-input-bg/60"
                }`}
            >
              <FaVideo
                className={`text-4xl sm:text-5xl mb-2 ${isIncoming ? "text-ancient-text-muted" : "text-ancient-icon-glow/50"
                  }`}
              />
              <span className="text-xs text-ancient-text-muted">Loading video…</span>
            </div>
          )}

          {/* Video thumbnail */}
          <video
            src={message?.content}
            className={`w-full h-auto max-h-[400px] object-cover ${loaded ? "block" : "hidden"}`}
            onLoadedData={() => setLoaded(true)}
            preload="metadata"
            crossOrigin="anonymous"
          >
            <source src={message?.content} type="video/mp4" />
            <source src={message?.content} type="video/webm" />
            <source src={message?.content} type="video/ogg" />
          </video>

          {/* Play button overlay */}
          {loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors duration-200">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-ancient-icon-glow/90 group-hover:bg-ancient-icon-glow flex items-center justify-center shadow-xl transition-transform duration-200 group-hover:scale-105">
                <FaPlay className="text-xl sm:text-2xl text-ancient-bg-dark ml-1" />
              </div>
            </div>
          )}

          {/* Caption */}
          {hasCaption && loaded && (
            <div className="absolute bottom-0 left-0 right-0 px-3 pt-6 pb-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
              <p className="text-white text-[13px] leading-snug line-clamp-3">
                {message.caption}
              </p>
            </div>
          )}

          {/* Time + status badge */}
          <div
            className={`absolute ${hasCaption && loaded ? "bottom-8" : "bottom-2"
              } right-2 z-10 flex items-center gap-1 px-2 py-[3px] rounded-full bg-black/50 backdrop-blur-sm`}
          >
            <span className="text-[10px] text-white/90 tabular-nums font-medium">
              {calculateTime(message.timestamp || message.createdAt)}
            </span>
            {message.senderId === userInfo?.id && (
              <span className="drop-shadow">
                <MessageStatus status={message.messageStatus || message.status} />
              </span>
            )}
          </div>
        </div>

        {/* Sparkles */}
        <div className="sparkles hidden sm:block" aria-hidden="true">
          <span className="sparkle sparkle-1">🎬</span>
          <span className="sparkle sparkle-2">✨</span>
          <span className="sparkle sparkle-3">📹</span>
        </div>
      </div>

      {showPreview && (
        <ChatMediaViewer
          initialMediaId={message.id}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}

export default VideoMessage;
