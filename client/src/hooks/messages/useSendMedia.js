import { useState, useCallback } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { MessageService } from '@/services/messageService';
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useSocketStore } from "@/stores/socketStore";
import { normalizeMessage } from "@/utils/messageHelpers";
import { upsertMessageInCache } from '@/lib/cacheHelpers';
import { showToast } from '@/lib/toast';

export const useSendMedia = () => {
    const [uploadProgress, setUploadProgress] = useState({ label: "", percent: 0 });
    const qc = useQueryClient();

    const userInfo = useAuthStore((s) => s.userInfo);
    const currentChatUser = useChatStore((s) => s.currentChatUser);
    const setMessages = useChatStore((s) => s.setMessages);
    const replyTo = useChatStore((s) => s.replyTo);
    const socket = useSocketStore((s) => s.socket);

    // Cache management helper
    const addToMessagesCache = useCallback((msg) => {
        upsertMessageInCache(qc, msg);
    }, [qc]);

    const uploadFile = useCallback(async (file, caption = "") => {
        if (!file || !currentChatUser?.id || !userInfo?.id) return;

        // 50 MB limit validation
        const MAX_FILE_SIZE = 50 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            showToast.error("File exceeds 50MB limit.");
            return;
        }

        const mime = file.type || "";
        const isImage = mime.startsWith("image/");
        const isVideo = mime.startsWith("video/");
        const field = isImage ? "image" : isVideo ? "video" : "file";
        const tempId = Date.now();

        const form = new FormData();
        form.append(field, file, file.name || 'upload');
        form.append("from", String(userInfo.id));
        form.append("to", String(currentChatUser.id));
        if (caption?.trim()) form.append("caption", caption.trim());
        if (replyTo?.id) form.append("replyToMessageId", String(replyTo.id));
        const isGroup = currentChatUser?.isGroup || currentChatUser?.type === 'group';
        if (isGroup) form.append("isGroup", "true");

        // Optimistic message
        const optimisticMsg = normalizeMessage({
            id: tempId,
            status: "pending",
            createdAt: new Date().toISOString(),
            content: "",
        }, userInfo.id, currentChatUser.id, isImage ? "image" : isVideo ? "video" : "document");
        if (caption?.trim()) optimisticMsg.caption = caption.trim();

        setMessages((prev) => ([...(prev || []), optimisticMsg]));

        try {
            setUploadProgress({
                label: isImage ? "Uploading image..." : isVideo ? "Uploading video..." : "Uploading file...",
                percent: 0
            });

            const onUploadProgress = (e) => {
                if (e.total) {
                    setUploadProgress((prev) => ({ ...prev, percent: Math.round((e.loaded * 100) / e.total) }));
                }
            };

            let data;
            if (isImage) {
                data = await MessageService.sendImage(form, onUploadProgress);
            } else if (isVideo) {
                data = await MessageService.sendVideo(form, onUploadProgress);
            } else {
                data = await MessageService.sendFile(form, onUploadProgress);
            }

            socket.current?.emit("send-msg", {
                to: currentChatUser.id,
                from: userInfo.id,
                message: data.content,
                type: data.type || (isImage ? "image" : isVideo ? "video" : "document"),
                messageId: data.id,
                replyToMessageId: data.replyToMessageId,
                quotedMessage: data.quotedMessage,
                caption: data.caption,
            });

            const msg = normalizeMessage(data, userInfo.id, currentChatUser.id, isImage ? "image" : isVideo ? "video" : "document");
            if (!msg.caption && caption?.trim()) msg.caption = caption.trim();

            // Remove optimistic and add real
            setMessages((prev) => prev.map(m => m.id === tempId ? msg : m));
            addToMessagesCache(msg);
        } catch (err) {
            useChatStore.getState().updateMessageStatus(tempId, "error");
            showToast.error("Upload failed. Try again.");
            console.error("uploadFile error", err);
        } finally {
            setTimeout(() => setUploadProgress({ label: "", percent: 0 }), 400);
        }
    }, [currentChatUser, userInfo, socket, replyTo, setMessages, addToMessagesCache]);

    return { uploadFile, uploadProgress };
};
