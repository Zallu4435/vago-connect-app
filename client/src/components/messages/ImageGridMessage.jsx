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
function ImageGridMessage({ messagesArray, isIncoming }) {
    const userInfo = useAuthStore((s) => s.userInfo);
    const currentChatUser = useChatStore((s) => s.currentChatUser);
    const isGroup = currentChatUser?.isGroup || currentChatUser?.type === "group";

    const [showImageViewer, setShowImageViewer] = useState(false);
    const [activeMediaId, setActiveMediaId] = useState(null);

    const lastMessage = messagesArray[messagesArray.length - 1];
    const firstMessage = messagesArray[0];

    // Show max 4 in the grid, rest hidden behind +N badge
    const displayMessages = messagesArray.slice(0, 4);
    const overflowCount = messagesArray.length > 4 ? messagesArray.length - 4 : 0;
    const count = displayMessages.length;

    const handleImageClick = (id) => {
        setActiveMediaId(id);
        setShowImageViewer(true);
    };

    // ── Grid layout definitions ───────────────────────────────
    function getGridConfig(n) {
        if (n === 1) {
            return {
                gridClass: "grid-cols-1 grid-rows-1",
                cellClass: () => "",
                containerH: "h-[250px] sm:h-[300px]",
            };
        }
        if (n === 2) {
            return {
                gridClass: "grid-cols-2 grid-rows-1",
                cellClass: () => "",
                containerH: "h-[220px] sm:h-[260px]",
            };
        }
        if (n === 3) {
            return {
                gridClass: "grid-cols-2 grid-rows-2",
                cellClass: (i) => (i === 0 ? "row-span-2" : ""),
                containerH: "h-[260px] sm:h-[310px]",
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
                <div className={`relative rounded-[10px] overflow-hidden bg-ancient-input-bg w-full ${containerH}`}>
                    <div className={`grid gap-[2px] ${gridClass} w-full h-full`}>
                        {displayMessages.map((msg, index) => {
                            const isLast4th = index === 3;
                            return (
                                <div key={msg.id} className={`relative w-full h-full ${cellClass(index)}`}>
                                    <GridImageItem
                                        msg={msg}
                                        index={index}
                                        handleImageClick={handleImageClick}
                                        cellClass={() => "w-full h-full"}
                                        isIncoming={isIncoming}
                                    />

                                    {/* +N overflow overlay on 4th tile */}
                                    {isLast4th && overflowCount > 0 && (
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

export default React.memo(ImageGridMessage);
