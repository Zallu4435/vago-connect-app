"use client";
import React, { useState, useRef } from "react";
import Avatar from "@/components/common/Avatar";
import MessageActions from "./MessageActions";
import ReactionModal from "@/components/common/ReactionModal";

/**
 * BaseMessageLayout
 * A unified presentation wrapper that eliminates duplicate boilerplate across varying message blocks.
 * It provides the Avatar placements, Selection Checkboxes, React Modal integration, 
 * and absolute-positioned floating emoji bubbles below the inner payload.
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

    return (
        <div className={`relative w-full flex ${isIncoming ? 'justify-start' : 'justify-end'} py-1`}>
            {selectMode && (
                <input
                    type="checkbox"
                    className="mr-2 sm:mr-3 mt-2 form-checkbox h-4 w-4 sm:h-5 sm:w-5 text-ancient-icon-glow border-ancient-border-stone rounded focus:ring-0 cursor-pointer flex-shrink-0"
                    checked={isSelected}
                    onChange={onSelectToggle}
                />
            )}

            <div className={`flex gap-2 items-end max-w-[85%] md:max-w-[80%]`}>
                {/* Incoming group chat avatars */}
                {isGroup && isIncoming && hasSender && (
                    <div className="flex-shrink-0 mb-1">
                        <Avatar type="sm" image={senderAvatar} setImage={() => { }} defaultImage="/default_avatar.png" />
                    </div>
                )}

                <div className="flex flex-col gap-1 min-w-0">
                    <div className="relative group">
                        {/* Nested Content Core (Text, ImageGrid, Document, etc.) */}
                        {children}

                        {/* Forward/Reply Actions drawer handle */}
                        {showActions && !selectMode && actionAnchorMessage && (
                            <MessageActions
                                message={actionAnchorMessage}
                                isIncoming={isIncoming}
                                onReply={onReply}
                                onForward={onForward}
                            />
                        )}

                        {/* Merged Reactions Display */}
                        {reactions && reactions.length > 0 && (
                            <div
                                ref={reactionsRef}
                                className={`
                                    absolute -bottom-3 sm:-bottom-4 right-0 sm:right-2
                                    flex gap-[2px] z-30 cursor-pointer 
                                    hover:brightness-110 active:scale-95 transition-all
                                    bg-ancient-bg-dark rounded-full p-[2px] shadow-sm
                                `}
                                onClick={() => setShowReactionsModal(true)}
                            >
                                {Object.entries(
                                    reactions.reduce((acc, r) => {
                                        const key = r.emoji || r;
                                        acc[key] = (acc[key] || 0) + 1;
                                        return acc;
                                    }, {})
                                ).map(([emoji, count]) => (
                                    <div
                                        key={emoji}
                                        className="flex items-center justify-center bg-ancient-bg border border-ancient-border-stone/40 rounded-full px-[5px] py-[1px] text-[11px] leading-none text-ancient-text-light"
                                    >
                                        <span className="mb-[1px] text-[13px]">{emoji}</span>
                                        {count > 1 && <span className="ml-[3px] font-bold text-[10px] text-ancient-text-muted">{count}</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Outgoing group chat avatars */}
                {isGroup && !isIncoming && hasSender && (
                    <div className="flex-shrink-0 mb-1">
                        <Avatar type="sm" image={senderAvatar} setImage={() => { }} defaultImage="/default_avatar.png" />
                    </div>
                )}
            </div>

            {/* Target Modal rendering */}
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

export default React.memo(BaseMessageLayout);
