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
    const isSelected = selectedIds?.includes(anchorMessage.id);

    // Flatten all reactions from the grid cluster
    const aggregatedReactions = messagesArray.flatMap(m => m.reactions || []);

    const handleGridSelect = () => {
        // Toggle selection for every ID within the Grid chunk
        messagesArray.forEach(m => {
            const targetState = !isSelected;
            const isCurrentlySelected = selectedIds.includes(m.id);
            if (targetState !== isCurrentlySelected) {
                onToggleSelect?.(m.id);
            }
        });
    };

    return (
        <BaseMessageLayout
            isIncoming={isIncoming}
            isGroup={isGroup}
            senderAvatar={senderAvatar}
            hasSender={!!anchorMessage?.sender}
            selectMode={selectMode}
            isSelected={isSelected}
            onSelectToggle={handleGridSelect}
            reactions={aggregatedReactions}
            reactionAnchorMessage={anchorMessage}
            actionAnchorMessage={messagesArray[messagesArray.length - 1]}
            showActions={true}
            onReply={onReply}
            onForward={onForward}
        >
            <ImageGridMessage
                messagesArray={messagesArray}
                isIncoming={isIncoming}
                chatMessages={chatMessages}
            />
        </BaseMessageLayout>
    );
}

export default React.memo(ImageGridWrapper, (prev, next) => {
    // Memoization needs to verify the array length hasn't changed
    if (prev.messagesArray.length !== next.messagesArray.length) return false;

    // Checks if the active anchor ID was suddenly selected or deselected
    const prevAnchorId = prev.messagesArray[0]?.id;
    const nextAnchorId = next.messagesArray[0]?.id;

    return (
        prev.isIncoming === next.isIncoming &&
        prev.selectMode === next.selectMode &&
        prev.selectedIds?.includes(prevAnchorId) === next.selectedIds?.includes(nextAnchorId)
    );
});
