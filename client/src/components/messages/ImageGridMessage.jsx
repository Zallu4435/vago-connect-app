/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "@/components/common/MessageStatus";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import dynamic from "next/dynamic";
import { RiShareForwardFill } from "react-icons/ri";
import GridImageItem from "./GridImageItem";

const ChatMediaViewer = dynamic(
    () => import("@/components/chat/ChatMediaViewer"),
    { ssr: false }
);

/**
 * ImageGridMessage — WhatsApp-style clustered image grid.
 */
function ImageGridMessage({ messagesArray, isIncoming, selectMode, selectedIds, onToggleSelect }) {
    const userInfo = useAuthStore((s) => s.userInfo);
    const currentChatUser = useChatStore((s) => s.currentChatUser);
    const isGroup = currentChatUser?.isGroup || currentChatUser?.type === "group";

    const [showImageViewer, setShowImageViewer] = useState(false);
    const [activeMediaId, setActiveMediaId] = useState(null);

    const lastMessage = messagesArray[messagesArray.length - 1];
    const firstMessage = messagesArray[0];

    // In selectMode, we show ALL images in the grid cluster. Otherwise, max 4.
    const displayMessages = selectMode ? messagesArray : messagesArray.slice(0, 4);
    const overflowCount = !selectMode && messagesArray.length > 4 ? messagesArray.length - 4 : 0;
    const count = displayMessages.length;

    const handleImageClick = (id) => {
        if (selectMode) {
            // Always pass as Number for consistency with the store
            onToggleSelect?.(Number(id));
            return;
        }
        const msg = messagesArray.find(m => Number(m.id) === Number(id));
        if (msg && (msg.isDeletedForEveryone || isMessageDeleted(msg))) return;
        setActiveMediaId(id);
        setShowImageViewer(true);
    };

    const isMessageDeleted = (msg) => {
        if (msg.isDeletedForEveryone) return true;
        const arr = msg.deletedBy;
        if (!Array.isArray(arr)) return false;
        const uid = userInfo?.id;
        if (!uid) return false;
        return arr.some((e) => {
            if (e == null) return false;
            const val = (typeof e === 'object') ? (e.userId ?? e.id ?? e) : e;
            return Number(val) === Number(uid);
        });
    };

    // ── Grid layout definitions ───────────────────────────────
    function getGridConfig(n) {
        if (n === 1) {
            return {
                gridClass: "grid-cols-1 grid-rows-1",
                cellClass: () => "",
                containerH: "h-[250px] sm:h-[300px] max-h-[300px]",
            };
        }
        if (n === 2) {
            return {
                gridClass: "grid-cols-2 grid-rows-1",
                cellClass: () => "",
                containerH: "h-[220px] sm:h-[260px] max-h-[260px]",
            };
        }
        if (n === 3) {
            return {
                gridClass: "grid-cols-2 grid-rows-2",
                cellClass: (i) => (i === 0 ? "row-span-2" : ""),
                containerH: "h-[260px] sm:h-[310px] max-h-[310px]",
            };
        }
        if (n >= 4 || selectMode) {
            // Expanded/Select mode uses a uniform 3-column grid for N items
            if (selectMode && messagesArray.length > 4) {
                return {
                    gridClass: "grid-cols-3 auto-rows-fr",
                    cellClass: () => "aspect-square",
                    containerH: "min-h-[280px] sm:min-h-[330px] max-h-[800px] h-auto overflow-y-auto custom-scrollbar-thin",
                };
            }
            return {
                gridClass: "grid-cols-2 grid-rows-2",
                cellClass: () => "",
                containerH: "h-[280px] sm:h-[330px] max-h-[330px]",
            };
        }
        return {
            gridClass: "grid-cols-2 grid-rows-2",
            cellClass: () => "",
            containerH: "h-[280px] sm:h-[330px]",
        };
    }

    const { gridClass, cellClass, containerH } = getGridConfig(count);

    return (
        <>
            <div
                className={`
                    message-bubble message-bubble-image
                    ${isIncoming ? "message-bubble-incoming" : "message-bubble-outgoing"}
                    p-[3px] w-[290px] sm:w-[340px]
                `}
            >
                {/* Group sender name */}
                {isGroup && isIncoming && firstMessage?.sender?.name && (
                    <div className="text-[11px] font-bold text-ancient-icon-glow truncate px-1 pt-1 pb-0.5">
                        {firstMessage.sender.name}
                    </div>
                )}

                {/* Forwarded banner */}
                {lastMessage.isForwarded && (
                    <div className="flex items-center gap-1 text-[11px] text-ancient-text-muted italic border-l-2 border-ancient-text-muted/40 pl-2 px-1 pt-0.5 pb-1 -ml-0.5">
                        <RiShareForwardFill className="text-[12px] flex-shrink-0" />
                        <span>Forwarded</span>
                    </div>
                )}

                {/* Grid container */}
                <div className={`relative rounded-[10px] overflow-hidden bg-ancient-input-bg w-full transition-all duration-300 ease-in-out ${containerH}`}>
                    <div className={`grid gap-[2px] ${gridClass} w-full h-full p-[1px]`}>
                        {displayMessages.map((msg, index) => {
                            return (
                                <div key={msg.id} className={`relative w-full h-full ${cellClass(index)}`}>
                                    {isMessageDeleted(msg) ? (
                                        <div className="flex items-center justify-center w-full h-full bg-ancient-bg-medium/40 border border-ancient-border-stone/20 text-ancient-text-muted italic gap-1.5 p-2">
                                            <span className="text-[10px] sm:text-xs text-center leading-tight">This message was deleted</span>
                                        </div>
                                    ) : (
                                        <GridImageItem
                                            msg={msg}
                                            index={index}
                                            handleImageClick={handleImageClick}
                                            cellClass={() => "w-full h-full"}
                                            isIncoming={isIncoming}
                                            selectMode={selectMode}
                                            isSelected={selectedIds?.some(x => Number(x) === Number(msg.id))}
                                            onToggleSelect={onToggleSelect}
                                        />
                                    )}

                                    {/* +N overflow overlay on 4th tile (Only in normal mode) */}
                                    {!selectMode && index === 3 && overflowCount > 0 && (
                                        <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] flex items-center justify-center pointer-events-none z-30">
                                            <span className="text-white text-3xl font-light tracking-wide drop-shadow">
                                                +{overflowCount}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Time + status badge — nested in Grid to stay on top */}
                    <div className="absolute bottom-2 right-2 z-40 flex items-center gap-1 px-2 py-[3px] rounded-full bg-black/55 backdrop-blur-sm">
                        <span className="text-[10px] text-white/90 tabular-nums font-medium drop-shadow">
                            {calculateTime(lastMessage.timestamp || lastMessage.createdAt)}
                        </span>
                        {!isIncoming && lastMessage.senderId === userInfo?.id && (
                            <div className="drop-shadow">
                                <MessageStatus
                                    status={lastMessage.messageStatus || lastMessage.status}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showImageViewer && (
                <ChatMediaViewer
                    initialMediaId={activeMediaId}
                    onClose={() => setShowImageViewer(false)}
                />
            )}
        </>
    );
}

export default React.memo(ImageGridMessage, (prev, next) => {
    // Re-render if selectMode changes
    if (prev.selectMode !== next.selectMode) return false;
    // Re-render if the cluster size changes
    if (prev.messagesArray.length !== next.messagesArray.length) return false;
    // Re-render if any selectedId within the cluster changes
    const prevIds = prev.selectedIds || [];
    const nextIds = next.selectedIds || [];
    for (const msg of prev.messagesArray) {
        const numId = Number(msg.id);
        const wasSel = prevIds.some(x => Number(x) === numId);
        const isSel = nextIds.some(x => Number(x) === numId);
        if (wasSel !== isSel) return false;
    }
    // Re-render if deletion state of any message changes
    for (let i = 0; i < prev.messagesArray.length; i++) {
        const pm = prev.messagesArray[i];
        const nm = next.messagesArray[i];
        if (pm.isDeletedForEveryone !== nm.isDeletedForEveryone) return false;
        if (JSON.stringify(pm.deletedBy) !== JSON.stringify(nm.deletedBy)) return false;
    }
    return true;
});
