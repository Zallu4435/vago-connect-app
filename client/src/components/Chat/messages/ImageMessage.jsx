"use client";
import React, { useState, useEffect } from "react";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "@/components/common/MessageStatus";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { FaImage } from "react-icons/fa";
import Image from "next/image";
import dynamic from "next/dynamic";
import RepliedMessageQuote from "./RepliedMessageQuote";
import { RiShareForwardFill } from "react-icons/ri";

const MediaCarouselView = dynamic(() => import("../MediaGallery/MediaCarouselView"), {
  ssr: false,
});

function ImageMessage({ message, isIncoming }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const isGroup = currentChatUser?.isGroup || currentChatUser?.type === 'group';
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const chatMessages = useChatStore((s) => s.messages) || [];

  const mediaItems = React.useMemo(() => {
    const list = chatMessages;
    const items = (Array.isArray(list) ? list : [])
      .filter((m) => String(m?.type || "").startsWith("image"))
      .map((m) => ({
        mediaId: m?.id,
        url: m?.content || m?.message || "",
        type: m?.type || "image",
        fileName: (typeof m?.caption === 'string' && m.caption) ? m.caption : "Image",
        caption: (typeof m?.caption === 'string' && m.caption?.trim()) ? m.caption.trim() : undefined,
        createdAt: m?.timestamp || m?.createdAt || new Date().toISOString(),
      }));

    // Fallback: ensure current message is present
    const hasCurrent = items.some((it) => Number(it.mediaId) === Number(message?.id));
    if (!hasCurrent && (message?.content || message?.message)) {
      items.push({
        mediaId: message?.id,
        url: message?.content || message?.message,
        type: message?.type || 'image',
        fileName: (typeof message?.caption === 'string' && message.caption) ? message.caption : 'Image',
        caption: (typeof message?.caption === 'string' && message.caption?.trim()) ? message.caption.trim() : undefined,
        createdAt: message?.timestamp || message?.createdAt || new Date().toISOString(),
      });
    }
    return items;
  }, [chatMessages, message?.id, message?.content, message?.message, message?.type, message?.caption, message?.timestamp, message?.createdAt]);

  const initialMediaIndex = React.useMemo(() => {
    return mediaItems.findIndex((mi) => Number(mi.mediaId) === Number(message?.id));
  }, [mediaItems, message?.id]);

  const hasCaption = message.caption && message.caption.trim().length > 0;

  useEffect(() => {
    setImageLoaded(false);
  }, [message.content]);

  return (
    <>
      <div className={`message-bubble message-bubble-image ${isIncoming ? 'message-bubble-incoming' : 'message-bubble-outgoing'} max-w-[480px]`}>
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
          <div className="mb-2 w-full max-w-[480px]">
            <RepliedMessageQuote quotedMessage={message.quotedMessage} />
          </div>
        )}
        <div
          className={`relative rounded-xl overflow-hidden shadow-xl cursor-pointer transition-all duration-200 hover:shadow-2xl group max-w-[480px] ${isIncoming
            ? "bg-ancient-bubble-user border border-ancient-input-border"
            : "bg-ancient-bubble-other border border-ancient-icon-glow/30"
            }`}
          onClick={() => setShowImageViewer(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowImageViewer(true);
            }
          }}
          aria-label="Open image preview"
        >
          {/* Loading skeleton */}
          {!imageLoaded && (
            <div
              className={`flex items-center justify-center w-full max-w-[480px] min-w-[220px] sm:min-w-[260px] min-h-[200px] sm:min-h-[280px] rounded-xl ${isIncoming ? "bg-ancient-input-bg" : "bg-ancient-input-bg/50"
                } animate-pulse`}
            >
              <FaImage className={`text-4xl sm:text-5xl ${isIncoming ? "text-ancient-text-muted" : "text-ancient-icon-glow/50"}`} />
            </div>
          )}

          {/* Image */}
          <div className={`relative w-full max-w-[480px] min-h-[200px] sm:min-h-[280px] ${imageLoaded ? 'block' : 'hidden'}`}>
            <Image
              src={message.content || message.message || ""}
              alt={hasCaption ? message.caption : "Sent image"}
              fill
              className="rounded-xl object-contain transition-opacity duration-300"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(false)}
              sizes="(max-width: 640px) 100vw, 480px"
            />
          </div>

          {/* Caption overlay */}
          {hasCaption && imageLoaded && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
              <p className="text-white text-sm leading-relaxed line-clamp-3">
                {message.caption}
              </p>
            </div>
          )}

          {/* Time and status overlay */}
          <div
            className={`absolute ${hasCaption ? 'bottom-12' : 'bottom-2'} right-2 flex items-center gap-1.5 px-2 py-1 rounded-md backdrop-blur-sm transition-opacity ${hasCaption
              ? 'bg-black/40'
              : 'bg-black/50 group-hover:bg-black/70'
              }`}
          >
            <span className="text-[10px] sm:text-[11px] text-white/90 font-medium tabular-nums">
              {calculateTime(message.timestamp || message.createdAt)}
            </span>
            {message.senderId === userInfo.id && (
              <MessageStatus status={message.messageStatus} />
            )}
          </div>

          {/* Hover overlay effect */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200 pointer-events-none" />
        </div>

        {/* Sparkle particles */}
        <div className="sparkles hidden sm:block" aria-hidden="true">
          <span className="sparkle sparkle-1">🖼️</span>
          <span className="sparkle sparkle-2">✨</span>
          <span className="sparkle sparkle-3">📸</span>
        </div>
      </div>

      {showImageViewer && mediaItems.length > 0 && (
        <MediaCarouselView
          mediaItems={mediaItems}
          initialIndex={initialMediaIndex >= 0 ? initialMediaIndex : 0}
          onClose={() => setShowImageViewer(false)}
          onDownload={(mediaId) => {
            const item = mediaItems.find((m) => Number(m.mediaId) === Number(mediaId));
            if (item?.url) window.open(item.url, "_blank");
          }}
        />
      )}
    </>
  );
}

export default ImageMessage;
