import React from 'react';

/**
 * A reusable indeterminate progress bar for media uploads.
 */
const MediaUploadProgressBar = ({
    message,
    isLocal,
    className = "",
    barHeight = "h-1",
    barBg = "bg-white/20"
}) => {
    const isPending = message?.status === "pending" || isLocal;

    if (!isPending) return null;

    return (
        <div className={`absolute inset-x-0 bottom-0 z-10 ${className}`}>
            <div className={`w-full ${barHeight} ${barBg} rounded-full overflow-hidden`}>
                <div className="h-full bg-ancient-icon-glow animate-progress-indeterminate"></div>
            </div>
        </div>
    );
};

export default MediaUploadProgressBar;
