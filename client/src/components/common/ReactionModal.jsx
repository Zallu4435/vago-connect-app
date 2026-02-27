import React, { useMemo, useState, useRef } from "react";
import { usePopoverPosition } from '@/hooks/ui/usePopoverPosition';
import { useClickOutside } from '@/hooks/ui/useClickOutside';
import { createPortal } from "react-dom";
import Avatar from "@/components/common/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { useReactToMessage } from '@/hooks/messages/useReactToMessage';
import { useChatStore } from "@/stores/chatStore";

export default function ReactionModal({ open, onClose, message, anchorRef, reactions, isLeft }) {
    // [DEBUG] Performance validation log
    const userInfo = useAuthStore((s) => s.userInfo);
    const currentChatUser = useChatStore((s) => s.currentChatUser);
    const reactMutation = useReactToMessage();
    const modalRef = useRef(null);
    const coords = usePopoverPosition({
        open,
        anchorRef,
        popoverRef: modalRef,
        placement: 'top',
        gap: 8
    });

    // Group reactions by emoji
    const groupedReactions = useMemo(() => {
        const safeReactions = reactions || message?.reactions || [];
        const groups = { All: safeReactions };
        safeReactions.forEach((r) => {
            const emoji = r.emoji;
            if (!groups[emoji]) {
                groups[emoji] = [];
            }
            groups[emoji].push(r);
        });
        return groups;
    }, [message?.reactions, reactions]);

    const tabs = Object.keys(groupedReactions);
    const [activeTab, setActiveTab] = useState("All");

    const displayedReactions = groupedReactions[activeTab] || [];

    const handleRemoveReaction = (reaction) => {
        if (isLeft) return;
        if (String(reaction.userId) === String(userInfo?.id)) {
            const peerId = currentChatUser?.id || currentChatUser?.conversationId;
            reactMutation.mutate({
                id: reaction.messageId || message.id,
                emoji: reaction.emoji,
                peerId
            });
        }
    };

    // Click outside to close
    useClickOutside(open, onClose, [modalRef, anchorRef]);

    if (!open) return null;

    // Use a portal similar to ActionSheet or EmojiPicker
    let portalRoot = null;
    if (typeof document !== 'undefined') {
        portalRoot = document.getElementById('action-sheet-portal');
        if (!portalRoot) {
            portalRoot = document.createElement('div');
            portalRoot.id = 'action-sheet-portal';
            document.body.appendChild(portalRoot);
        }
    }

    if (!portalRoot) return null;

    return createPortal(
        <div
            ref={modalRef}
            className="fixed z-[10000] shadow-2xl animate-fade-in-up"
            style={{ top: coords.top, left: coords.left, visibility: coords.visibility }}
        >
            <div className="flex flex-col bg-ancient-bg-dark rounded-xl overflow-hidden shadow-2xl border border-ancient-border-stone" style={{ width: '280px', maxHeight: '350px' }}>
                {/* Tabs */}
                <div className="flex overflow-x-auto border-b border-ancient-border-stone hide-scrollbar bg-ancient-bg-medium">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                                px-4 py-3 whitespace-nowrap transition-colors flex items-center gap-2
                                ${activeTab === tab
                                    ? "border-b-2 border-ancient-icon-glow text-ancient-icon-glow"
                                    : "text-ancient-text-muted hover:text-ancient-text-light"}
                            `}
                        >
                            {tab !== "All" && <span className="text-xl">{tab}</span>}
                            {tab === "All" && <span>All</span>}
                            <span className="text-xs bg-ancient-input-bg rounded-full px-2 py-0.5">
                                {groupedReactions[tab].length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Reaction List */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-ancient-border-stone">
                    {displayedReactions.map((reaction, index) => {
                        const user = reaction.user || {};
                        const isMe = String(reaction.userId) === String(userInfo?.id);

                        return (
                            <div
                                key={`${reaction.userId}-${index}`}
                                className={`flex items-center justify-between p-2 rounded-lg hover:bg-ancient-input-bg transition-colors ${isMe && !isLeft ? 'cursor-pointer group' : ''}`}
                                onClick={() => (isMe && !isLeft) ? handleRemoveReaction(reaction) : null}
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        type="sm"
                                        image={user.profileImage || "/default_avatar.png"}
                                        setImage={() => { }}
                                        defaultImage="/default_avatar.png"
                                    />
                                    <span className="text-ancient-text-light text-sm font-medium">
                                        {isMe ? "You" : (user.name || "Unknown User")}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{reaction.emoji}</span>
                                    {isMe && (
                                        <span className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Remove
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {displayedReactions.length === 0 && (
                        <div className="flex items-center justify-center p-4 text-sm text-ancient-text-muted">
                            No reactions found.
                        </div>
                    )}
                </div>
            </div>
        </div>,
        portalRoot
    );
}
