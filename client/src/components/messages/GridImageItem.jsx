/* eslint-disable @next/next/no-img-element */
import React from "react";
import { useMediaTransition } from "@/hooks/messages/useMediaTransition";
import MediaUploadProgressBar from "@/components/common/MediaUploadProgressBar";
import { FaImage } from "react-icons/fa";

/**
 * A single image item within the ImageGridMessage.
 * Handles local-to-remote transitions and upload progress.
 */
const GridImageItem = ({ msg, index, handleImageClick, cellClass, isIncoming, selectMode, isSelected, onToggleSelect }) => {
    const { isLoaded, setIsLoaded, isLocal } = useMediaTransition(msg, "GridImageItem");

    return (
        <div
            onClick={() => handleImageClick(msg.id)}
            className={`relative cursor-pointer overflow-hidden group w-full h-full ${cellClass(index)}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleImageClick(msg.id);
                }
            }}
            aria-label="Open image from grid"
        >
            {/* Loading skeleton (Pulse if NOT local and NOT loaded) */}
            {!isLoaded && !isLocal && (
                <div className={`absolute inset-0 z-10 flex items-center justify-center animate-pulse ${isIncoming ? "bg-ancient-input-bg" : "bg-ancient-input-bg/60"}`}>
                    <FaImage className={`text-2xl sm:text-3xl ${isIncoming ? "text-ancient-text-muted" : "text-ancient-icon-glow/50"}`} />
                </div>
            )}

            {/* Spinner overlay if loading */}
            {!isLoaded && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/5 backdrop-blur-sm pointer-events-none">
                    <div className="w-6 h-6 border-2 border-ancient-icon-glow/30 border-t-ancient-icon-glow rounded-full animate-spin"></div>
                </div>
            )}

            <img
                src={msg.content || msg.message || ""}
                alt="Grouped image"
                className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ease-out ${isLoaded ? "opacity-100 blur-0" : "opacity-0 blur-md"}`}
                onLoad={() => setIsLoaded(true)}
                onError={() => setIsLoaded(true)}
                loading="lazy"
            />

            {/* Selection Overlay */}
            {selectMode && (
                <div
                    className={`absolute inset-0 z-30 flex items-start justify-end p-2 transition-all duration-200 ${isSelected ? "bg-ancient-icon-glow/20" : "bg-black/10 hover:bg-black/20"}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect?.(Number(msg.id));
                    }}
                >

                    <div className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
                        ${isSelected
                            ? "bg-ancient-icon-glow border-ancient-icon-glow text-ancient-bg-dark"
                            : "border-white/70 bg-black/20"
                        }
                    `}>
                        {isSelected && (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                </div>
            )}

            {/* Progress bar overlay if sending */}
            <MediaUploadProgressBar message={msg} isLocal={isLocal} className="p-0.5" barHeight="h-[2px]" />

            {/* Hover dim */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/12 transition-colors duration-200 pointer-events-none" />
        </div>
    );
};

export default React.memo(GridImageItem, (prev, next) => {
    // Always re-render if selection state changes
    if (prev.isSelected !== next.isSelected) return false;
    if (prev.selectMode !== next.selectMode) return false;
    // Re-render if the message content/state changes
    if (prev.msg?.id !== next.msg?.id) return false;
    if (prev.msg?.content !== next.msg?.content) return false;
    if (prev.msg?.messageStatus !== next.msg?.messageStatus) return false;
    if (prev.isIncoming !== next.isIncoming) return false;
    return true;
});

