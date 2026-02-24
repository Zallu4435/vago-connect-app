"use client";
import React, { useState, useEffect } from "react";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "@/components/common/MessageStatus";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import MediaCarouselView from "../MediaGallery/MediaCarouselView";
import { FaPlay, FaVideo } from "react-icons/fa";

function VideoMessage({ message, isIncoming }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const [loaded, setLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef(null);

  const hasCaption = typeof message?.caption === "string" && message.caption.trim().length > 0;

  useEffect(() => {
    setLoaded(false);
    setIsPlaying(false);
  }, [message?.content]);

  const chatMessages = useChatStore((s) => s.messages) || [];
  const mediaItems = React.useMemo(() => {
    const list = Array.isArray(chatMessages) ? chatMessages : [];
    return list
      .filter((m) => {
        const t = String(m?.type || "");
        return t.startsWith("image") || t.startsWith("video");
      })
      .map((m) => ({
        mediaId: m?.id,
        url: m?.content || m?.message || "",
        type: m?.type || "image",
        fileName: (typeof m?.caption === 'string' && m.caption) ? m.caption : (m?.type?.startsWith('video') ? 'Video' : 'Image'),
        caption: (typeof m?.caption === 'string' && m.caption?.trim()) ? m.caption.trim() : undefined,
        createdAt: m?.timestamp || m?.createdAt || new Date().toISOString(),
      }));
  }, [chatMessages]);

  const initialMediaIndex = React.useMemo(() => {
    return mediaItems.findIndex((mi) => Number(mi.mediaId) === Number(message?.id));
  }, [mediaItems, message?.id]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <>
      <div className={`message-bubble message-bubble-video ${isIncoming ? 'message-bubble-incoming' : 'message-bubble-outgoing'} max-w-[480px]`}>
        <div
          className={`relative rounded-xl overflow-hidden shadow-xl cursor-pointer transition-all duration-200 hover:shadow-2xl group max-w-[480px] ${isIncoming
              ? "bg-ancient-bubble-user border border-ancient-input-border"
              : "bg-ancient-bubble-other border border-ancient-icon-glow/30"
            }`}
          role="button"
          tabIndex={0}
          aria-label="Open video preview"
        >
          {/* Loading skeleton */}
          {!loaded && (
            <div
              className={`flex flex-col items-center justify-center w-full max-w-[480px] min-h-[220px] sm:min-h-[280px] animate-pulse ${isIncoming ? "bg-ancient-input-bg" : "bg-ancient-input-bg/50"
                }`}
            >
              <FaVideo className={`text-4xl sm:text-5xl mb-3 ${isIncoming ? "text-ancient-text-muted" : "text-ancient-icon-glow/50"}`} />
              <span className="text-xs text-ancient-text-muted">Loading video...</span>
            </div>
          )}

          {/* Video element */}
          <div className="relative max-w-[480px]">
            <video
              ref={videoRef}
              src={message?.content}
              className={`w-full max-w-[480px] h-auto max-h-[400px] sm:max-h-[500px] object-contain ${loaded ? 'block' : 'hidden'
                }`}
              onLoadedData={() => setLoaded(true)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              onClick={() => setShowPreview(true)}
              preload="metadata"
              playsInline
              crossOrigin="anonymous"
            >
              <source src={message?.content} type="video/mp4" />
              <source src={message?.content} type="video/webm" />
              <source src={message?.content} type="video/ogg" />
              Your browser does not support the video tag.
            </video>

            {/* Play button overlay (when not playing) */}
            {loaded && !isPlaying && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayPause();
                }}
              >
                <button
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-ancient-icon-glow/90 hover:bg-ancient-icon-glow flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110"
                  aria-label="Play video"
                  type="button"
                >
                  <FaPlay className="text-xl sm:text-2xl text-ancient-bg-dark ml-1" />
                </button>
              </div>
            )}
          </div>

          {/* Caption overlay */}
          {hasCaption && loaded && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
              <p className="text-white text-sm leading-relaxed line-clamp-3">
                {message.caption}
              </p>
            </div>
          )}

          {/* Time and status overlay */}
          <div
            className={`absolute ${hasCaption ? 'bottom-12' : 'bottom-2'} right-2 flex items-center gap-1.5 px-2 py-1 rounded-md backdrop-blur-sm transition-opacity z-10 ${hasCaption
                ? 'bg-black/40'
                : 'bg-black/50 group-hover:bg-black/70'
              }`}
          >
            <FaVideo className="text-[10px] text-white/80" />
            <span className="text-[10px] sm:text-[11px] text-white/90 font-medium tabular-nums">
              {calculateTime(message.timestamp || message.createdAt)}
            </span>
            {message.senderId === userInfo.id && (
              <MessageStatus status={message.messageStatus || message.status} />
            )}
          </div>

          {/* Hover overlay effect */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200 pointer-events-none" />
        </div>

        {/* Sparkle particles */}
        <div className="sparkles hidden sm:block" aria-hidden="true">
          <span className="sparkle sparkle-1">🎬</span>
          <span className="sparkle sparkle-2">✨</span>
          <span className="sparkle sparkle-3">📹</span>
        </div>
      </div>

      {showPreview && mediaItems.length > 0 && (
        <MediaCarouselView
          mediaItems={mediaItems}
          initialIndex={initialMediaIndex >= 0 ? initialMediaIndex : 0}
          onClose={() => setShowPreview(false)}
          onDownload={(mediaId) => {
            const item = mediaItems.find((m) => Number(m.mediaId) === Number(mediaId));
            if (item?.url) window.open(item.url, "_blank");
          }}
        />
      )}
    </>
  );
}

export default VideoMessage;
