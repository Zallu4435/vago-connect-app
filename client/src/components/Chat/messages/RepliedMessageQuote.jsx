import React from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";

export default function RepliedMessageQuote({ quotedMessage }) {
    const userInfo = useAuthStore((s) => s.userInfo);
    const currentChatUser = useChatStore((s) => s.currentChatUser);

    if (!quotedMessage) return null;

    const isMine = String(quotedMessage.senderId) === String(userInfo?.id);
    const replyingToLabel = isMine ? "You" : currentChatUser?.name || "Contact";
    const summary = quotedMessage.type === "text" ? quotedMessage.content || "" : `[${quotedMessage.type}]`;

    return (
        <div className="bg-ancient-bg-dark/20 border-l-4 border-ancient-icon-glow rounded-r flex flex-col p-2 mb-2 w-full truncate cursor-pointer hover:bg-ancient-bg-dark/30 transition-colors">
            <span className="text-[11px] sm:text-xs text-ancient-icon-glow font-bold mb-0.5">
                {replyingToLabel}
            </span>
            <span className="text-[11px] sm:text-xs text-ancient-text-muted truncate">
                {summary}
            </span>
        </div>
    );
}
