"use client";
import React, { useState, useRef } from "react";
import Avatar from "@/components/common/Avatar";
import MessageActions from "./MessageActions";
import ReactionModal from "@/components/common/ReactionModal";

/**
 * BaseMessageLayout
 * Unified wrapper for all message types.
 * Reactions appear as an absolute pill tucked below the bubble corner
 * (same as WhatsApp), with a bottom margin that creates space for them.
 */
function BaseMessageLayout({
    isIncoming,
    isGroup,
    senderAvatar,
    hasSender,
    selectMode,
    isSelected,
    onSelectToggle,
    reactions,
    reactionAnchorMessage,
    actionAnchorMessage,
    showActions,
    onReply,
    onForward,
    children,
}) {

    const [showReactionsModal, setShowReactionsModal] = useState(false);
    const reactionsRef = useRef(null);

    const hasReactions = reactions && reactions.length > 0;

    // Aggregate emoji → count
    const reactionMap = hasReactions
        ? reactions.reduce((acc, r) => {
            const key = r.emoji || r;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {})
        : {};

    return (
        <div className={`relative w-full flex ${isIncoming ? "justify-start" : "justify-end"} py-1`}>
            {selectMode && (
                <input
                    type="checkbox"
                    className="mr-2 sm:mr-3 mt-2 form-checkbox h-4 w-4 sm:h-5 sm:w-5 text-ancient-icon-glow border-ancient-border-stone rounded focus:ring-0 cursor-pointer flex-shrink-0"
                    checked={isSelected}
                    onChange={onSelectToggle}
                />
            )}

            <div className={`flex gap-2 items-end max-w-[85%] md:max-w-[80%]`}>
                {/* Incoming group avatar */}
                {isGroup && isIncoming && hasSender && (
                    <div className="flex-shrink-0 mb-1">
                        <Avatar type="sm" image={senderAvatar} setImage={() => { }} defaultImage="/default_avatar.png" />
                    </div>
                )}

                {/* Bubble + reaction pill column */}
                <div className={`relative flex flex-col group ${hasReactions ? "pb-4" : ""}`}>
                    {/* Message content */}
                    {children}

                    {/* Forward/Reply swipe actions */}
                    {showActions && !selectMode && actionAnchorMessage && (
                        <MessageActions
                            message={actionAnchorMessage}
                            isIncoming={isIncoming}
                            onReply={onReply}
                            onForward={onForward}
                        />
                    )}

                    {/* ── Reaction pill — WhatsApp style ── */}
                    {hasReactions && (
                        <div
                            ref={reactionsRef}
                            className={`
                                absolute -bottom-1 z-30 cursor-pointer
                                flex items-center gap-[2px]
                                ${isIncoming ? "left-2" : "right-2"}
                            `}
                            onClick={() => setShowReactionsModal(true)}
                        >
                            <div className="
                                flex items-center gap-[3px]
                                bg-ancient-bg-dark/90 backdrop-blur-sm
                                border border-ancient-border-stone/50
                                rounded-full px-2 py-[3px] shadow-md
                                hover:brightness-110 active:scale-95 transition-all
                            ">
                                {Object.entries(reactionMap).map(([emoji, count]) => (
                                    <div key={emoji} className="flex items-center gap-[2px]">
                                        <span className="text-[15px] leading-none">{emoji}</span>
                                        {count > 1 && (
                                            <span className="text-[11px] font-semibold text-ancient-text-muted tabular-nums">
                                                {count}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Outgoing group avatar */}
                {isGroup && !isIncoming && hasSender && (
                    <div className="flex-shrink-0 mb-1">
                        <Avatar type="sm" image={senderAvatar} setImage={() => { }} defaultImage="/default_avatar.png" />
                    </div>
                )}
            </div>

            <ReactionModal
                open={showReactionsModal}
                onClose={() => setShowReactionsModal(false)}
                message={reactionAnchorMessage}
                anchorRef={reactionsRef}
                reactions={reactions}
            />
        </div>
    );
}

function arePropsEqual(prev, next) {
    // Basic shallow checks for primitive props
    if (
        prev.isIncoming !== next.isIncoming ||
        prev.isGroup !== next.isGroup ||
        prev.senderAvatar !== next.senderAvatar ||
        prev.hasSender !== next.hasSender ||
        prev.selectMode !== next.selectMode ||
        prev.isSelected !== next.isSelected ||
        prev.showActions !== next.showActions
    ) {
        return false;
    }

    // Reaction comparison: compare lengths first, then content if needed
    const prevReactions = prev.reactions || [];
    const nextReactions = next.reactions || [];
    if (prevReactions.length !== nextReactions.length) return false;

    // Optional: shallow content check for reactions to detect emoji switches
    for (let i = 0; i < prevReactions.length; i++) {
        const pr = prevReactions[i];
        const nr = nextReactions[i];
        if (pr.emoji !== nr.emoji || pr.userId !== nr.userId) return false;
    }

    // Note: reactionAnchorMessage and actionAnchorMessage are usually the same object 
    // but if ids change, we should re-render
    if (prev.reactionAnchorMessage?.id !== next.reactionAnchorMessage?.id) return false;
    if (prev.actionAnchorMessage?.id !== next.actionAnchorMessage?.id) return false;

    return true;
}

export default React.memo(BaseMessageLayout, arePropsEqual);
