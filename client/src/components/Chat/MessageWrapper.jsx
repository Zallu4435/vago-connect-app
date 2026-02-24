"use client";
import React from "react";
import Avatar from "@/components/common/Avatar";
import MessageActions from "./MessageActions";

import { useChatStore } from "@/stores/chatStore";

/**
 * MessageWrapper - Unified wrapper for all message types
 * Handles layout, avatar positioning, alignment, and common message features
 */
function MessageWrapper({
    message,
    isIncoming,
    selectMode,
    selectedIds,
    onToggleSelect,
    onReply,
    onForward,
    children,
}) {
    const currentChatUser = useChatStore((s) => s.currentChatUser);
    const isGroup = currentChatUser?.isGroup || currentChatUser?.type === 'group';
    const senderAvatar = message?.sender?.profileImage || "/default_avatar.png";
    const isSelected = selectedIds?.includes(message.id);

    return (
        <div
            className={`relative w-full flex ${isIncoming ? 'justify-start' : 'justify-end'} py-1`}
        >
            {/* Selection checkbox when selectMode is on */}
            {selectMode && (
                <input
                    type="checkbox"
                    className="mr-2 sm:mr-3 mt-2 form-checkbox h-4 w-4 sm:h-5 sm:w-5 text-ancient-icon-glow border-ancient-border-stone rounded focus:ring-0 cursor-pointer flex-shrink-0"
                    checked={isSelected}
                    onChange={() => onToggleSelect?.(message.id)}
                />
            )}

            {/* Message content with avatar */}
            <div className={`flex gap-2 items-end max-w-[85%] md:max-w-[80%]`}>
                {/* Avatar for incoming messages (left side) */}
                {isGroup && isIncoming && message?.sender && (
                    <div className="flex-shrink-0 mb-1">
                        <Avatar
                            type="sm"
                            image={senderAvatar}
                            setImage={() => { }}
                            defaultImage="/default_avatar.png"
                        />
                    </div>
                )}

                {/* Message bubble and metadata */}
                <div className="flex flex-col gap-1 min-w-0">

                    {/* Message content with actions */}
                    <div className="relative group">
                        {children}
                        {!message.isDeletedForEveryone && (
                            <MessageActions
                                message={message}
                                isIncoming={isIncoming}
                                onReply={onReply}
                                onForward={onForward}
                            />
                        )}
                    </div>

                    {/* Reactions */}
                    {Array.isArray(message.reactions) && message.reactions.length > 0 && (
                        <div className="flex gap-2 text-xs mt-1 px-2 flex-wrap">
                            {Object.entries(
                                message.reactions.reduce((acc, r) => {
                                    const key = r.emoji || r;
                                    acc[key] = (acc[key] || 0) + 1;
                                    return acc;
                                }, {})
                            ).map(([emoji, count]) => (
                                <span
                                    key={emoji}
                                    className="px-2 py-1 rounded-full bg-ancient-input-bg/60 border border-ancient-border-stone/40 shadow-sm backdrop-blur-sm text-[11px] sm:text-xs"
                                >
                                    {emoji} {count > 1 && count}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Avatar for outgoing messages (right side) */}
                {isGroup && !isIncoming && message?.sender && (
                    <div className="flex-shrink-0 mb-1">
                        <Avatar
                            type="sm"
                            image={senderAvatar}
                            setImage={() => { }}
                            defaultImage="/default_avatar.png"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default MessageWrapper;
