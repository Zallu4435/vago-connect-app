import React from "react";

export default function ReplyPreview({ replyTo, currentChatUser, userInfo, onCancel }) {
  if (!replyTo) return null;
  const replyingToLabel =
    String(replyTo.senderId) === String(userInfo?.id)
      ? "You"
      : currentChatUser?.name || "Contact";
  const summary = replyTo.type === "text" ? replyTo.content || "" : `[${replyTo.type}]`;

  return (
    <div className="absolute -top-16 left-3 right-3 sm:left-4 sm:right-4 z-20">
      <div className="
        flex items-start justify-between gap-2 sm:gap-3
        px-3 sm:px-4 py-2 sm:py-2.5
        bg-ancient-bg-medium border border-ancient-input-border rounded-lg shadow-lg
      ">
        <div className="min-w-0">
          <div className="
            text-[10px] sm:text-xs text-ancient-text-muted font-semibold
            truncate max-w-full
          ">
            Replying to {replyingToLabel}
          </div>
          <div className="
            text-sm sm:text-base text-ancient-text-light truncate max-w-full
          ">
            {summary}
          </div>
        </div>
        <button
          onClick={onCancel}
          className="
            shrink-0 ml-2 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-md
            bg-ancient-input-bg border border-ancient-input-border 
            text-ancient-text-muted hover:text-ancient-text-light hover:border-ancient-icon-glow
            transition-colors whitespace-nowrap
          "
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
