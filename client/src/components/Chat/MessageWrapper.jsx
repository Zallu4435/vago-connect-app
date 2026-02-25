"use client";
import React from "react";
import BaseMessageLayout from "./BaseMessageLayout";
import { useChatStore } from "@/stores/chatStore";

import TextMessage from "./messages/TextMessage";
import ImageMessage from "./messages/ImageMessage";
import AudioMessage from "./messages/AudioMessage";
import VideoMessage from "./messages/VideoMessage";
import DocumentMessage from "./messages/DocumentMessage";
import DeletedMessage from "./messages/DeletedMessage";
import CallMessage from "./messages/CallMessage";
import SystemMessage from "./messages/SystemMessage";

/**
 * MessageWrapper - Unified wrapper for all single message types
 * Defers shared structural UI (Avatars, Checks, Reactions) to BaseMessageLayout
 */
function MessageWrapper({
    message,
    isIncoming,
    selectMode,
    selectedIds,
    onToggleSelect,
    onReply,
    onForward,
}) {
    const currentChatUser = useChatStore((s) => s.currentChatUser);
    const isGroup = currentChatUser?.isGroup || currentChatUser?.type === 'group';
    const senderAvatar = message?.sender?.profileImage || "/default_avatar.png";
    const isSelected = selectedIds?.includes(message.id);
    const isCall = message.type === "call";

    if (message.isSystemMessage) {
        return <SystemMessage message={message} />;
    }

    return (
        <BaseMessageLayout
            isIncoming={isIncoming}
            isGroup={isGroup}
            senderAvatar={senderAvatar}
            hasSender={!!message?.sender}
            selectMode={selectMode}
            isSelected={isSelected}
            onSelectToggle={() => onToggleSelect?.(message.id)}
            reactions={isCall ? [] : (message.isDeletedForEveryone ? [] : message.reactions)}
            reactionAnchorMessage={isCall ? null : message}
            actionAnchorMessage={isCall ? null : message}
            showActions={!message.isDeletedForEveryone && !isCall}
            onReply={isCall ? undefined : onReply}
            onForward={isCall ? undefined : onForward}
        >
            {message.isDeletedForEveryone ? (
                <DeletedMessage message={message} isIncoming={isIncoming} />
            ) : (
                <>
                    {message.type === "call" && (
                        <CallMessage message={message} isIncoming={isIncoming} />
                    )}
                    {message.type === "text" && (
                        <TextMessage message={message} isIncoming={isIncoming} />
                    )}
                    {message.type === "image" && (
                        <ImageMessage message={message} isIncoming={isIncoming} />
                    )}
                    {(message.type === "audio" || message.type === "voice") && (
                        <AudioMessage message={message} isIncoming={isIncoming} />
                    )}
                    {message.type === "video" && (
                        <VideoMessage message={message} isIncoming={isIncoming} />
                    )}
                    {(message.type === "document" || (!['text', 'image', 'audio', 'video', 'location', 'voice', 'call'].includes(String(message.type || '')))) && (
                        <DocumentMessage message={message} isIncoming={isIncoming} />
                    )}
                </>
            )}
        </BaseMessageLayout>
    );
}

export default React.memo(MessageWrapper, (prev, next) => {
    return (
        prev.message === next.message &&
        prev.isIncoming === next.isIncoming &&
        prev.selectMode === next.selectMode &&
        prev.selectedIds?.includes(prev.message.id) === next.selectedIds?.includes(next.message.id)
    );
});
