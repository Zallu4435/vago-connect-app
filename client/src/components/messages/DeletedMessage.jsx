"use client";
import React from "react";
import { calculateTime } from "@/utils/CalculateTime";
import { FaBan } from "react-icons/fa";

function DeletedMessage({ message, isIncoming }) {
    const messageBubbleClass = isIncoming
        ? "bg-ancient-bg-medium/40 border border-ancient-border-stone/30 text-ancient-text-muted"
        : "bg-ancient-bg-medium/40 border border-ancient-border-stone/30 text-ancient-text-muted";

    return (
        <div className={`message-bubble ${isIncoming ? 'message-bubble-incoming' : 'message-bubble-outgoing'} ${messageBubbleClass} max-w-[420px] italic flex flex-col`}>
            <div className="flex flex-row items-center gap-2 pr-4">
                <FaBan className="text-xs opacity-50 shrink-0" />
                <span className="text-sm sm:text-base whitespace-nowrap">
                    This message was deleted
                </span>
            </div>
            <div className="flex justify-end mt-1">
                <span className="text-[10px] text-ancient-text-muted/60 tabular-nums leading-none">
                    {calculateTime(message.timestamp || message.createdAt)}
                </span>
            </div>
        </div>
    );
}

export default DeletedMessage;
