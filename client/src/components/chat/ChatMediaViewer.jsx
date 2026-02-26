"use client";
import React, { useMemo } from "react";
import { useChatStore } from "@/stores/chatStore";
import { downloadMedia } from "@/utils/downloadMedia";
import dynamic from "next/dynamic";

const MediaCarouselView = dynamic(
    () => import("@/components/chat/MediaCarouselView"),
    { ssr: false }
);

import { getFileName } from "@/utils/fileHelpers";

/**
 * Wrapper for MediaCarouselView used specifically within Chat Bubbles.
 * Subscribes to the heavy `chatMessages` array only when mounted (user clicks an image),
 * preventing O(N^2) renders across the entire chat log.
 */
export default function ChatMediaViewer({ initialMediaId, onClose }) {
    const messages = useChatStore((s) => s.messages);
    const mediaItems = useMemo(() => {
        const chatMessages = messages || [];
        return (Array.isArray(chatMessages) ? chatMessages : [])
            .filter((m) => {
                const t = String(m?.type || "");
                return t.startsWith("image") || t.startsWith("video") || t.startsWith("document");
            })
            .map((m) => ({
                mediaId: m?.id,
                url: m?.content || m?.message || "",
                type: m?.type || "image",
                fileName: getFileName(m?.caption || m?.fileName || m?.content || m?.message),
                caption: typeof m?.caption === "string" && m.caption?.trim() ? m.caption.trim() : undefined,
                createdAt: m?.timestamp || m?.createdAt || new Date().toISOString(),
            }));
    }, [messages]);

    const initialIndex = useMemo(() => {
        const idx = mediaItems.findIndex((mi) => String(mi.mediaId) === String(initialMediaId));
        return idx >= 0 ? idx : 0;
    }, [mediaItems, initialMediaId]);

    return (
        <MediaCarouselView
            mediaItems={mediaItems}
            initialIndex={initialIndex}
            onClose={onClose}
            onDownload={(mediaId) => {
                const item = mediaItems.find((m) => String(m.mediaId) === String(mediaId));
                if (item?.url) downloadMedia(item.url, item.fileName || "media");
            }}
        />
    );
}
