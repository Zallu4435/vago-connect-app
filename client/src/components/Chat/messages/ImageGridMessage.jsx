import React, { useState } from "react";
import { calculateTime } from "@/utils/CalculateTime";
import { downloadMedia } from "@/utils/downloadMedia";
import MessageStatus from "@/components/common/MessageStatus";
import { useAuthStore } from "@/stores/authStore";
import dynamic from "next/dynamic";
import { RiShareForwardFill } from "react-icons/ri";

const MediaCarouselView = dynamic(() => import("../MediaGallery/MediaCarouselView"), {
    ssr: false,
});

/**
 * ImageGridMessage renders an array of image messages in a WhatsApp-style clustered grid.
 */
function ImageGridMessage({ messagesArray, isIncoming, chatMessages = [] }) {
    const userInfo = useAuthStore((s) => s.userInfo);
    const [showImageViewer, setShowImageViewer] = useState(false);
    const [activeMediaId, setActiveMediaId] = useState(null);

    // Use the last message in the array as the anchor for timestamps/status
    const lastMessage = messagesArray[messagesArray.length - 1];

    // Show up to 4 images natively in a 2x2 grid. The rest hide behind a +X overlay.
    const displayMessages = messagesArray.slice(0, 4);
    const overflowCount = messagesArray.length > 4 ? messagesArray.length - 4 : 0;

    // Global Media array for the CarouselViewer to traverse
    const mediaItems = React.useMemo(() => {
        const list = chatMessages;
        return (Array.isArray(list) ? list : [])
            .filter((m) => String(m?.type || "").startsWith("image"))
            .map((m) => ({
                mediaId: m?.id,
                url: m?.content || m?.message || "",
                type: m?.type || "image",
                fileName: (typeof m?.caption === 'string' && m.caption) ? m.caption : "Image",
                caption: (typeof m?.caption === 'string' && m.caption?.trim()) ? m.caption.trim() : undefined,
                createdAt: m?.timestamp || m?.createdAt || new Date().toISOString(),
            }));
    }, [chatMessages]);

    const handleImageClick = (clickedId) => {
        setActiveMediaId(clickedId);
        setShowImageViewer(true);
    };

    const initialMediaIndex = React.useMemo(() => {
        return mediaItems.findIndex((mi) => Number(mi.mediaId) === Number(activeMediaId));
    }, [mediaItems, activeMediaId]);

    // Determine grid template strictly
    let gridClass = "grid-cols-2 grid-rows-2"; // default 4-grid and 3-grid
    if (messagesArray.length === 2) gridClass = "grid-cols-2 grid-rows-1";

    return (
        <>
            <div className={`message-bubble message-bubble-image ${isIncoming ? 'message-bubble-incoming' : 'message-bubble-outgoing'} p-[3px] w-[300px] sm:w-[350px]`}>
                {lastMessage.isForwarded && (
                    <div className="flex items-center gap-1 text-[11px] sm:text-[12px] text-ancient-text-muted mb-1 px-1 italic">
                        <RiShareForwardFill />
                        <span>Forwarded</span>
                    </div>
                )}

                <div className="relative rounded-xl overflow-hidden shadow-sm bg-ancient-input-bg w-full h-[294px] sm:h-[344px] flex">
                    {/* Grid Container */}
                    <div className={`grid gap-[3px] ${gridClass} w-full h-full`}>
                        {displayMessages.map((msg, index) => {
                            const isLastTile = index === 3;
                            const isThirdInThreeGrid = messagesArray.length === 3 && index === 2;

                            return (
                                <div
                                    key={msg.id}
                                    onClick={() => handleImageClick(msg.id)}
                                    className={`relative cursor-pointer overflow-hidden group transition-all w-full h-full ${isThirdInThreeGrid ? "col-span-2" : "col-span-1"
                                        }`}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleImageClick(msg.id);
                                        }
                                    }}
                                    aria-label="Open image from grid"
                                >
                                    <img
                                        src={msg.content || msg.message || ""}
                                        alt="Grid sent image"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                        loading="lazy"
                                    />

                                    {/* Overlay for +X overflow on the 4th tile */}
                                    {isLastTile && overflowCount > 0 && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                                            <span className="text-white text-3xl font-light tracking-wide shadow-sm">+{overflowCount}</span>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 pointer-events-none" />
                                </div>
                            );
                        })}
                    </div>

                    {/* Singular Time and status overlay anchored to the bottom right of the entire Grid Frame */}
                    <div
                        className="absolute bottom-1.5 right-1.5 flex items-center gap-1.5 px-2 py-1 rounded-full backdrop-blur-sm transition-opacity bg-black/40 hover:bg-black/60 shadow-md"
                    >
                        <span className="text-[10px] sm:text-[11px] text-white/90 font-medium tabular-nums drop-shadow-md">
                            {calculateTime(lastMessage.timestamp || lastMessage.createdAt)}
                        </span>
                        {!isIncoming && lastMessage.senderId === userInfo.id && (
                            <div className="drop-shadow-md">
                                <MessageStatus status={lastMessage.messageStatus || lastMessage.status} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showImageViewer && mediaItems.length > 0 && (
                <MediaCarouselView
                    mediaItems={mediaItems}
                    initialIndex={initialMediaIndex >= 0 ? initialMediaIndex : 0}
                    onClose={() => setShowImageViewer(false)}
                    onDownload={(mediaId) => {
                        const item = mediaItems.find((m) => Number(m.mediaId) === Number(mediaId));
                        if (item?.url) downloadMedia(item.url, item.fileName || "photo.jpg");
                    }}
                />
            )}
        </>
    );
}

export default React.memo(ImageGridMessage);
