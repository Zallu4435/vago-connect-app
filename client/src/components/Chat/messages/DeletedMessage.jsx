"use client";
import React from "react";
import { calculateTime } from "@/utils/CalculateTime";
import { FaBan } from "react-icons/fa";

function DeletedMessage({ message, isIncoming }) {
    const messageBubbleClass = isIncoming
        ? "bg-ancient-bg-medium/40 border border-ancient-border-stone/30 text-ancient-text-muted"
        : "bg-ancient-bg-medium/40 border border-ancient-border-stone/30 text-ancient-text-muted";

    return (
        <div className={`message-bubble ${isIncoming ? 'message-bubble-incoming' : 'message-bubble-outgoing'} ${messageBubbleClass} max-w-[420px] italic flex items-center gap-2`}>
            <FaBan className="text-xs opacity-50" />
            <div className="flex flex-col gap-1 flex-1">
                <span className="text-sm sm:text-base">
                    This message was deleted
                </span>
                <div className="flex justify-end">
                    <span className="text-[10px] text-ancient-text-muted/60 tabular-nums">
                        {calculateTime(message.timestamp || message.createdAt)}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default DeletedMessage;
