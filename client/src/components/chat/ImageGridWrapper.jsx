"use client";
import React from "react";
import BaseMessageLayout from "./BaseMessageLayout";
import { useChatStore } from "@/stores/chatStore";
import ImageGridMessage from '@/components/messages/ImageGridMessage';

/**
 * ImageGridWrapper - Wraps arrays of clustered images
 * Defers shared structural UI (Avatars, Checks, Reactions) to BaseMessageLayout
 */
function ImageGridWrapper({
    messagesArray,
    isIncoming,
    selectMode,
    selectedIds,
    onToggleSelect,
    onReply,
    onForward,
    chatMessages,
}) {
    const currentChatUser = useChatStore((s) => s.currentChatUser);
    const isGroup = currentChatUser?.isGroup || currentChatUser?.type === 'group';

    // We source the sender info from the first message in the cluster consistently
    const anchorMessage = messagesArray[0];
    const senderAvatar = anchorMessage?.sender?.profileImage || "/default_avatar.png";

    // In Select Mode, we blanket select or deselect the entire Grid chunk based on the anchor ID
    const isSelected = messagesArray.some(m => selectedIds?.some(x => Number(x) === Number(m.id)));

    // Flatten all reactions from the grid cluster
    const aggregatedReactions = messagesArray.flatMap(m => m.reactions || []);

    return (
        <BaseMessageLayout
            isIncoming={isIncoming}
            isGroup={isGroup}
            senderAvatar={senderAvatar}
            hasSender={!!anchorMessage?.sender}
            selectMode={selectMode}
            isSelected={isSelected}
            onSelectToggle={() => { }} // Individual items handle their own selection
            reactions={aggregatedReactions}
            reactionAnchorMessage={anchorMessage}
            actionAnchorMessage={messagesArray[messagesArray.length - 1]}
            showActions={true}
            onReply={onReply}
            onForward={onForward}
            isGrid={true}
        >
            <ImageGridMessage
                messagesArray={messagesArray}
                isIncoming={isIncoming}
                chatMessages={chatMessages}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={onToggleSelect}
            />
        </BaseMessageLayout>
    );
}

export default React.memo(ImageGridWrapper, (prev, next) => {
    // 1. Verify basic props
    if (
        prev.isIncoming !== next.isIncoming ||
        prev.selectMode !== next.selectMode ||
        prev.messagesArray.length !== next.messagesArray.length
    ) {
        return false;
    }

    // 2. Check cluster selection state
    const prevAnySelected = prev.messagesArray.some(m => prev.selectedIds?.some(x => Number(x) === Number(m.id)));
    const nextAnySelected = next.messagesArray.some(m => next.selectedIds?.some(x => Number(x) === Number(m.id)));
    if (prevAnySelected !== nextAnySelected) return false;

    // Check if individual selections within the cluster changed
    for (const m of prev.messagesArray) {
        const pSel = prev.selectedIds?.some(x => Number(x) === Number(m.id));
        const nSel = next.selectedIds?.some(x => Number(x) === Number(m.id));
        if (pSel !== nSel) return false;
    }

    // 3. Check for reaction changes across the entire grid
    // This is crucial because ImageGridWrapper flattens reactions
    const prevReactions = prev.messagesArray.flatMap(m => m.reactions || []);
    const nextReactions = next.messagesArray.flatMap(m => m.reactions || []);

    if (prevReactions.length !== nextReactions.length) return false;

    for (let i = 0; i < prevReactions.length; i++) {
        if (
            prevReactions[i].emoji !== nextReactions[i].emoji ||
            prevReactions[i].userId !== nextReactions[i].userId
        ) {
            return false;
        }
    }

    // 4. Check for deletion status changes within the cluster
    for (let i = 0; i < prev.messagesArray.length; i++) {
        const pm = prev.messagesArray[i];
        const nm = next.messagesArray[i];
        if (pm.isDeletedForEveryone !== nm.isDeletedForEveryone) return false;
        if (JSON.stringify(pm.deletedBy) !== JSON.stringify(nm.deletedBy)) return false;
    }

    return true;
});
