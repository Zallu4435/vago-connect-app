"use client";
import React, { useState, useEffect } from "react";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "@/components/common/MessageStatus";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { FaImage } from "react-icons/fa";
import MediaCarouselView from "../MediaGallery/MediaCarouselView";
import Avatar from "@/components/common/Avatar";

function ImageMessage({ message }) {
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const userInfo = useAuthStore((s) => s.userInfo);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const chatMessages = useChatStore((s) => s.messages) || [];
  
  const mediaItems = React.useMemo(() => {
    const list = Array.isArray(chatMessages) ? chatMessages : [];
    const items = list
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

  const isIncoming = message?.senderId === currentChatUser?.id;
  const senderAvatar = message?.sender?.profileImage || "/default_mystical_avatar.png";
  const hasCaption = message.caption && message.caption.trim().length > 0;

  useEffect(() => {
    setImageLoaded(false);
  }, [message.content]);

  return (
    <>
      <div className={`flex flex-col w-full max-w-[85%] sm:max-w-[75%] md:max-w-[65%] gap-1 ${isIncoming ? 'items-start' : 'items-end'}`}>
        {message.isForwarded && (
          <span className="text-[10px] text-ancient-text-muted italic px-2">Forwarded</span>
        )}
        
        <div className={`message-bubble message-bubble-image ${isIncoming ? 'message-bubble-incoming' : 'message-bubble-outgoing'}`}>
          <div
            className={`relative rounded-xl overflow-hidden shadow-xl cursor-pointer transition-all duration-200 hover:shadow-2xl group ${
              isIncoming
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
            {/* Sender Avatar (top corner) */}
            {isIncoming && message?.sender && (
              <div className="absolute top-2 left-2 z-10 opacity-90 hover:opacity-100 transition-opacity">
                <Avatar type="sm" image={senderAvatar} setImage={() => {}} defaultImage="/default_avatar.png" />
              </div>
            )}
            {!isIncoming && message?.sender && (
              <div className="absolute top-2 right-2 z-10 opacity-90 hover:opacity-100 transition-opacity">
                <Avatar type="sm" image={senderAvatar} setImage={() => {}} defaultImage="/default_avatar.png" />
              </div>
            )}

            {/* Loading skeleton */}
            {!imageLoaded && (
              <div
                className={`flex items-center justify-center w-full min-h-[200px] sm:min-h-[280px] rounded-xl ${
                  isIncoming ? "bg-ancient-input-bg" : "bg-ancient-input-bg/50"
                } animate-pulse`}
              >
                <FaImage className={`text-4xl sm:text-5xl ${isIncoming ? "text-ancient-text-muted" : "text-ancient-icon-glow/50"}`} />
              </div>
            )}

            {/* Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.content || message.message || ""}
              alt={hasCaption ? message.caption : "Sent image"}
              className={`rounded-xl object-cover w-full h-auto max-h-[400px] sm:max-h-[500px] ${
                imageLoaded ? 'block' : 'hidden'
              } transition-opacity duration-300`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(false)}
              loading="lazy"
            />

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
              className={`absolute ${hasCaption ? 'bottom-12' : 'bottom-2'} right-2 flex items-center gap-1.5 px-2 py-1 rounded-md backdrop-blur-sm transition-opacity ${
                hasCaption 
                  ? 'bg-black/40' 
                  : 'bg-black/50 group-hover:bg-black/70'
              }`}
            >
              <span className="text-[10px] sm:text-[11px] text-white/90 font-medium tabular-nums">
                {calculateTime(message.timestamp || message.createdAt)}
              </span>
              {message.senderId === userInfo.id && (
                <MessageStatus MessageStatus={message.messageStatus} />
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
