"use client";
import React from "react";
import { MdInsertDriveFile, MdDownload } from "react-icons/md";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "@/components/common/MessageStatus";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import dynamic from "next/dynamic";

const MediaCarouselView = dynamic(() => import("../MediaGallery/MediaCarouselView"), {
  ssr: false,
});

function getFileName(urlOrName) {
  if (!urlOrName) return "Document";
  try {
    const u = new URL(urlOrName);
    const base = u.pathname.split("/").pop() || "Document";
    return decodeURIComponent(base);
  } catch {
    return String(urlOrName);
  }
}

function getFileExtension(fileName) {
  if (!fileName) return "";
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop().toUpperCase() : "";
}

function DocumentMessage({ message, isIncoming }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const messages = useChatStore((s) => s.messages) || [];
  const fileName = getFileName(message?.fileName || message?.content || message?.message);
  const fileExt = getFileExtension(fileName);
  const [showPreview, setShowPreview] = React.useState(false);

  const mediaItems = React.useMemo(() => {
    const list = messages;
    return (Array.isArray(list) ? list : [])
      .filter((m) => {
        const t = String(m?.type || "");
        return t.startsWith("image") || t.startsWith("video") || t.startsWith("document");
      })
      .map((m) => ({
        mediaId: m?.id,
        url: m?.content || m?.message || "",
        type: m?.type || "document",
        fileName: getFileName(m?.fileName || m?.content || m?.message),
        createdAt: m?.timestamp || m?.createdAt || new Date().toISOString(),
      }));
  }, [messages]);

  const initialIndex = React.useMemo(
    () => mediaItems.findIndex((mi) => Number(mi.mediaId) === Number(message?.id)),
    [mediaItems, message?.id]
  );

  return (
    <>
      <div className={`message-bubble message-bubble-document ${isIncoming ? 'message-bubble-incoming' : 'message-bubble-outgoing'} max-w-[380px]`}>
        <div
          className={`relative p-3 sm:p-4 rounded-xl shadow-lg flex items-center gap-3 cursor-pointer transition-all duration-200 hover:shadow-xl group ${isIncoming
            ? "bg-ancient-bubble-user border border-ancient-input-border"
            : "bg-ancient-bubble-other border border-ancient-icon-glow/30"
            }`}
          onClick={() => setShowPreview(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowPreview(true);
            }
          }}
          aria-label={`Open document: ${fileName}`}
        >
          {/* File Icon with Extension Badge */}
          <div className="relative flex-shrink-0">
            <div className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-lg transition-colors ${isIncoming
              ? "bg-ancient-input-bg border border-ancient-border-stone"
              : "bg-ancient-bg-dark/40 border border-ancient-icon-glow/40"
              }`}>
              <MdInsertDriveFile className={`text-2xl sm:text-3xl ${isIncoming ? "text-ancient-icon-glow" : "text-ancient-icon-glow"
                }`} />
            </div>
            {fileExt && (
              <span className={`absolute -bottom-1 -right-1 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded ${isIncoming
                ? "bg-ancient-icon-glow text-ancient-bg-dark"
                : "bg-ancient-bg-dark text-ancient-icon-glow"
                } shadow-sm`}>
                {fileExt}
              </span>
            )}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className={`text-sm sm:text-base font-medium truncate leading-tight ${isIncoming ? "text-ancient-text-light" : "text-ancient-text-light"
              }`}>
              {fileName}
            </div>

            <div className="mt-2 flex items-center gap-2 text-[10px] sm:text-[11px] text-ancient-text-muted flex-wrap">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(message?.content || message?.message, "_blank");
                }}
                className="underline hover:text-ancient-icon-glow transition-colors focus:outline-none focus:ring-1 focus:ring-ancient-icon-glow rounded px-1"
                aria-label="Open document in new tab"
              >
                Open
              </button>
              <span className="text-ancient-text-muted/50">•</span>
              <span className="tabular-nums">{calculateTime(message.timestamp || message.createdAt)}</span>
              {message?.senderId === userInfo?.id && (
                <>
                  <span className="text-ancient-text-muted/50">•</span>
                  <MessageStatus status={message.messageStatus || message.status} />
                </>
              )}
            </div>
          </div>

          {/* Download Icon (appears on hover) */}
          <a
            href={message?.content || message?.message}
            download
            onClick={(e) => e.stopPropagation()}
            className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 ${isIncoming
              ? "bg-ancient-icon-glow/10 hover:bg-ancient-icon-glow/20 text-ancient-icon-glow"
              : "bg-ancient-bg-dark/20 hover:bg-ancient-bg-dark/40 text-ancient-icon-glow"
              }`}
            aria-label="Download document"
          >
            <MdDownload className="text-base sm:text-lg" />
          </a>
        </div>

        {/* Sparkle particles */}
        <div className="sparkles hidden sm:block" aria-hidden="true">
          <span className="sparkle sparkle-1">📄</span>
          <span className="sparkle sparkle-2">✨</span>
          <span className="sparkle sparkle-3">📋</span>
        </div>
      </div>

      {showPreview && mediaItems.length > 0 && (
        <MediaCarouselView
          mediaItems={mediaItems}
          initialIndex={initialIndex >= 0 ? initialIndex : 0}
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

export default DocumentMessage;
