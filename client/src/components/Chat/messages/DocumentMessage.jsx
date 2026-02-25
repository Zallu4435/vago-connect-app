"use client";
import React from "react";
import { MdInsertDriveFile, MdDownload, MdOpenInNew } from "react-icons/md";
import { calculateTime } from "@/utils/CalculateTime";
import { downloadMedia } from "@/utils/downloadMedia";
import MessageStatus from "@/components/common/MessageStatus";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import dynamic from "next/dynamic";
import RepliedMessageQuote from "./RepliedMessageQuote";
import { RiShareForwardFill } from "react-icons/ri";

const MediaCarouselView = dynamic(
  () => import("../MediaGallery/MediaCarouselView"),
  { ssr: false }
);

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

// Maps extension to a color accent
function extColor(ext) {
  switch (ext) {
    case "PDF": return "bg-red-500 text-white";
    case "DOC":
    case "DOCX": return "bg-blue-500 text-white";
    case "XLS":
    case "XLSX": return "bg-emerald-600 text-white";
    case "PPT":
    case "PPTX": return "bg-orange-500 text-white";
    case "ZIP":
    case "RAR": return "bg-purple-600 text-white";
    case "MP3":
    case "WAV": return "bg-pink-500 text-white";
    default: return "bg-ancient-icon-glow text-ancient-bg-dark";
  }
}

function DocumentMessage({ message, isIncoming }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const isGroup = currentChatUser?.isGroup || currentChatUser?.type === "group";
  const messages = useChatStore((s) => s.messages) || [];
  const fileName = getFileName(message?.fileName || message?.content || message?.message);
  const fileExt = getFileExtension(fileName);
  const [showPreview, setShowPreview] = React.useState(false);

  const mediaItems = React.useMemo(
    () =>
      (Array.isArray(messages) ? messages : [])
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
        })),
    [messages]
  );

  const initialIndex = React.useMemo(
    () => mediaItems.findIndex((mi) => Number(mi.mediaId) === Number(message?.id)),
    [mediaItems, message?.id]
  );

  const fileUrl = message?.content || message?.message;

  return (
    <>
      <div
        className={`
          message-bubble message-bubble-document
          ${isIncoming ? "message-bubble-incoming" : "message-bubble-outgoing"}
          max-w-[360px] sm:max-w-[400px]
        `}
      >
        {/* Group sender name */}
        {isGroup && isIncoming && message.sender?.name && (
          <div className="text-[11px] font-bold text-ancient-icon-glow truncate mb-1">
            {message.sender.name}
          </div>
        )}

        {/* Forwarded banner — ONCE, above the card */}
        {message.isForwarded && (
          <div className="flex items-center gap-1 text-[11px] text-ancient-text-muted italic border-l-2 border-ancient-text-muted/40 pl-2 mb-1.5 -ml-1">
            <RiShareForwardFill className="text-[12px] flex-shrink-0" />
            <span>Forwarded</span>
          </div>
        )}

        {/* Quoted reply */}
        {message.quotedMessage && (
          <div className="mb-2 w-full">
            <RepliedMessageQuote quotedMessage={message.quotedMessage} />
          </div>
        )}

        {/* Document card */}
        <div
          className={`
            relative flex items-center gap-3 p-3 sm:p-3.5 rounded-xl
            cursor-pointer group transition-all duration-200
            shadow-md hover:shadow-lg
            ${isIncoming
              ? "bg-ancient-bubble-user/80 border border-ancient-input-border hover:bg-ancient-bubble-user"
              : "bg-ancient-bubble-other/80 border border-ancient-icon-glow/25 hover:bg-ancient-bubble-other"
            }
          `}
          onClick={() => setShowPreview(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setShowPreview(true);
            }
          }}
          aria-label={`Open document: ${fileName}`}
        >
          {/* File icon + extension badge */}
          <div className="relative flex-shrink-0">
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${isIncoming
                  ? "bg-ancient-input-bg border border-ancient-border-stone"
                  : "bg-ancient-bg-dark/50 border border-ancient-icon-glow/30"
                }`}
            >
              <MdInsertDriveFile className="text-2xl sm:text-3xl text-ancient-icon-glow" />
            </div>
            {fileExt && (
              <span
                className={`absolute -bottom-1 -right-1 text-[7px] sm:text-[8px] font-bold px-1 py-[2px] rounded leading-none shadow ${extColor(fileExt)}`}
              >
                {fileExt}
              </span>
            )}
          </div>

          {/* File name + meta */}
          <div className="flex-1 min-w-0">
            <div className="text-[13px] sm:text-sm font-semibold text-ancient-text-light truncate leading-snug">
              {fileName}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] sm:text-[11px] text-ancient-text-muted flex-wrap">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(fileUrl, "_blank");
                }}
                className="flex items-center gap-0.5 underline hover:text-ancient-icon-glow transition-colors focus:outline-none"
                aria-label="Open in new tab"
              >
                <MdOpenInNew className="text-[11px]" />
                Open
              </button>
              <span className="text-ancient-text-muted/40">•</span>
              <span className="tabular-nums">
                {calculateTime(message.timestamp || message.createdAt)}
              </span>
              {message?.senderId === userInfo?.id && (
                <>
                  <span className="text-ancient-text-muted/40">•</span>
                  <MessageStatus status={message.messageStatus || message.status} />
                </>
              )}
            </div>
          </div>

          {/* Download button — visible on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadMedia(fileUrl, fileName);
            }}
            className={`
              flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
              opacity-0 group-hover:opacity-100 transition-all duration-200
              ${isIncoming
                ? "bg-ancient-icon-glow/15 hover:bg-ancient-icon-glow/30 text-ancient-icon-glow"
                : "bg-ancient-bg-dark/30 hover:bg-ancient-bg-dark/50 text-ancient-icon-glow"
              }
            `}
            aria-label="Download document"
          >
            <MdDownload className="text-base sm:text-lg" />
          </button>
        </div>

        {/* Sparkles */}
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
            const item = mediaItems.find(
              (m) => Number(m.mediaId) === Number(mediaId)
            );
            if (item?.url) downloadMedia(item.url, item.fileName || "document");
          }}
        />
      )}
    </>
  );
}

export default DocumentMessage;
