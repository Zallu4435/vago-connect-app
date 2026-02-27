"use client";
import React from "react";
import BaseMessageLayout from "./BaseMessageLayout";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { useContacts } from "@/hooks/contacts/useContacts";

import TextMessage from '@/components/messages/TextMessage';
import ImageMessage from '@/components/messages/ImageMessage';
import AudioMessage from '@/components/messages/AudioMessage';
import VideoMessage from '@/components/messages/VideoMessage';
import DocumentMessage from '@/components/messages/DocumentMessage';
import DeletedMessage from '@/components/messages/DeletedMessage';
import CallMessage from '@/components/messages/CallMessage';
import SystemMessage from '@/components/messages/SystemMessage';

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
    const userInfo = useAuthStore((s) => s.userInfo);
    const { data: contacts = [] } = useContacts(userInfo?.id);
    const contactEntry = contacts.find((c) => String(c?.id) === String(currentChatUser?.id));
    const isLeft = Boolean(contactEntry?.leftAt);

    const isGroup = currentChatUser?.isGroup || currentChatUser?.type === 'group';
    const senderAvatar = message?.sender?.profileImage || "/default_avatar.png";
    const isSelected = selectedIds?.some(x => Number(x) === Number(message.id));

    const isDeletedForMe = React.useMemo(() => {
        const arr = message?.deletedBy;
        if (!Array.isArray(arr)) return false;
        const uidStr = String(userInfo?.id ?? "");
        return arr.some((e) => {
            if (e == null) return false;
            const val = (typeof e === 'object') ? (e.userId ?? e.id ?? e) : e;
            return String(val) === uidStr;
        });
    }, [message?.deletedBy, userInfo?.id]);

    const isDeleted = message.isDeletedForEveryone || isDeletedForMe;

    // Determine if it's a call by explicitly checking JSON content if type is missing, or type === 'call'
    const isCall = message.type === "call" || (message.content && message.content.includes('"callType"'));

    if (message.isSystemMessage && !isCall) {
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
            reactions={isCall ? [] : (isDeleted ? [] : message.reactions)}
            reactionAnchorMessage={message}
            actionAnchorMessage={message}
            showActions={!isDeleted && !isCall}
            onReply={isCall ? undefined : onReply}
            onForward={isCall ? undefined : onForward}
            isLeft={isLeft}
        >
            {isDeleted ? (
                <DeletedMessage message={message} isIncoming={isIncoming} />
            ) : (
                <>
                    {isCall && (
                        <CallMessage message={message} isIncoming={isIncoming} />
                    )}
                    {!isCall && message.type === "text" && (
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
                    {!isCall && (message.type === "document" || (!['text', 'image', 'audio', 'video', 'location', 'voice', 'call'].includes(String(message.type || '')))) && (
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
        prev.selectedIds?.some(x => Number(x) === Number(prev.message.id)) === next.selectedIds?.some(x => Number(x) === Number(next.message.id))
    );
});
