"use client";
import React from "react";
import {
    MdPhone, MdVideocam,
    MdCallMade, MdCallReceived, MdCallMissed,
} from "react-icons/md";

/**
 * Format seconds → "0:19" | "1:05"
 */
function fmtDuration(sec) {
    if (!sec || sec <= 0) return null;
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/**
 * CallMessage — Pixel-accurate WhatsApp-style call record.
 *
 * Rendered INSIDE BaseMessageLayout (which provides the bubble shell,
 * direction, avatar, and timestamp area). This component only renders
 * the INNER content of the bubble.
 *
 * WhatsApp layout inside bubble:
 * ┌────────────────────────────────────────┐
 * │  ╔══════╗   Voice call                │
 * │  ║  📞  ║   ↙ 0:19          1:07 PM  │
 * │  ╚══════╝                             │
 * └────────────────────────────────────────┘
 */
export default function CallMessage({ message, isIncoming }) {
    let callType = "audio", status = "initiated", duration = 0;
    try {
        const p = JSON.parse(message?.content || "{}");
        callType = p.callType ?? "audio";
        status = p.status ?? "initiated";
        duration = Number(p.duration ?? 0);
    } catch { }

    const isVideo = callType === "video";
    const PhoneIcon = isVideo ? MdVideocam : MdPhone;

    // ── States ──────────────────────────────────────────────────────────────
    const missed = status === "missed";
    const rejected = status === "rejected";
    const ended = status === "ended";
    const bad = missed || rejected;
    const good = ended;

    // Arrow
    let ArrowIcon = isIncoming ? MdCallReceived : MdCallMade;
    if (missed) ArrowIcon = MdCallMissed;

    // Colours
    const iconBg = bad ? "bg-red-500/20" : good ? "bg-ancient-icon-glow/20" : "bg-ancient-text-muted/15";
    const iconColor = bad ? "text-red-400" : good ? "text-ancient-icon-glow" : "text-ancient-text-muted";
    const arrowCls = bad ? "text-red-400" : good ? "text-ancient-icon-glow" : "text-ancient-text-muted";
    const titleCls = missed ? "text-red-400 font-semibold" : "text-ancient-text-light font-semibold";

    // Text
    const title = missed ? (isVideo ? "Missed video call" : "Missed voice call")
        : isVideo ? "Video call"
            : "Voice call";

    const dur = fmtDuration(duration);
    const meta = ended && dur ? dur
        : rejected ? "Declined"
            : null;

    // Timestamp
    const time = message?.createdAt
        ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : null;

    const bubbleClass = isIncoming
        ? "bg-ancient-bubble-user text-ancient-text-light"
        : "bg-ancient-bubble-other text-ancient-text-light";

    return (
        <div
            className={`
                message-bubble
                ${isIncoming ? "message-bubble-incoming" : "message-bubble-outgoing"}
                ${bubbleClass}
                flex items-center gap-3 min-w-[180px] px-3 py-2
            `}
            role="group"
            aria-label={title}
        >
            {/* ── Icon circle ─────────────────────────────────────────────── */}
            <div className={`
        flex-shrink-0 w-11 h-11 rounded-full
        flex items-center justify-center
        ${iconBg}
      `}>
                <PhoneIcon className={`text-[22px] ${iconColor}`} />
            </div>

            {/* ── Info block ──────────────────────────────────────────────── */}
            <div className="flex flex-col flex-1 min-w-0 gap-0.5">

                {/* Title */}
                <span className={`text-[14px] leading-snug ${titleCls}`}>
                    {title}
                </span>

                {/* Arrow + meta row */}
                <div className="flex items-center gap-1">
                    <ArrowIcon className={`text-[13px] flex-shrink-0 ${arrowCls}`} />
                    {meta && (
                        <span className="text-[12px] text-ancient-text-muted leading-none">
                            {meta}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Timestamp ───────────────────────────────────────────────── */}
            {time && (
                <span className="self-end text-[10px] text-ancient-text-muted whitespace-nowrap pb-0.5 flex-shrink-0">
                    {time}
                </span>
            )}
        </div>
    );
}
