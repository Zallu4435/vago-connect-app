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
import { getFileName, getFileExtension, getExtensionColor } from "@/utils/fileHelpers";
import MediaUploadProgressBar from "../common/MediaUploadProgressBar";

const ChatMediaViewer = dynamic(
  () => import("@/components/chat/ChatMediaViewer"),
  { ssr: false }
);



function DocumentMessage({ message, isIncoming }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const isGroup = currentChatUser?.isGroup || currentChatUser?.type === "group";
  const messages = useChatStore((s) => s.messages) || [];
  const fileName = getFileName(message?.fileName || message?.content || message?.message);
  const ext = getFileExtension(fileName);
  const colorClass = getExtensionColor(ext);
  const [showPreview, setShowPreview] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);



  const fileUrl = message?.content || message?.message;
  const isLocal = !!message.isLocal;

  React.useEffect(() => {
    console.log(`[DocumentMessage] Content changed. msgId: ${message.id}, isLocal: ${isLocal}, url: ${fileUrl?.substring(0, 30)}...`);
  }, [fileUrl, message.id, isLocal]);

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
            {ext && (
              <span
                className={`absolute -bottom-1 -right-1 text-[7px] sm:text-[8px] font-bold px-1 py-[2px] rounded leading-none shadow ${colorClass}`}
              >
                {ext}
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
            onClick={async (e) => {
              e.stopPropagation();
              if (isDownloading) return;
              setIsDownloading(true);
              try {
                await downloadMedia(fileUrl, fileName);
              } finally {
                setIsDownloading(false);
              }
            }}
            disabled={isDownloading}
            className={`
              flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
              transition-all duration-200
              ${isDownloading ? "opacity-100 cursor-wait" : "opacity-0 group-hover:opacity-100 cursor-pointer"}
              ${isIncoming
                ? "bg-ancient-icon-glow/15 hover:bg-ancient-icon-glow/30 text-ancient-icon-glow"
                : "bg-ancient-bg-dark/30 hover:bg-ancient-bg-dark/50 text-ancient-icon-glow"
              }
            `}
            aria-label="Download document"
          >
            {isDownloading ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : (
              <MdDownload className="text-base sm:text-lg" />
            )}
          </button>

          {/* Uploading progress bar overlay at the bottom of the card */}
          <MediaUploadProgressBar
            message={message}
            isLocal={isLocal}
            className="bottom-0 rounded-b-xl overflow-hidden"
            barHeight="h-[3px]"
            barBg="bg-white/10"
          />
        </div>

        {/* Sparkles */}
        <div className="sparkles hidden sm:block" aria-hidden="true">
          <span className="sparkle sparkle-1">📄</span>
          <span className="sparkle sparkle-2">✨</span>
          <span className="sparkle sparkle-3">📋</span>
        </div>
      </div>

      {showPreview && (
        <ChatMediaViewer
          initialMediaId={message?.id}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}

export default DocumentMessage;
