import { MessageService } from "../../services/MessageService.js";
import { SocketEmitter } from "../../utils/SocketEmitter.js";

export function handleChatEvents(io, socket, onlineUsers) {
    socket.on("add-user", (userId) => {
        const uidStr = String(userId);
        socket.userId = uidStr; // Attach for disconnect tracking
        socket.join(uidStr);
        onlineUsers.set(uidStr, (onlineUsers.get(uidStr) || 0) + 1);

        socket.broadcast.emit("user-online", { userId: uidStr });
        // Only emit full list to the connecting socket
        socket.emit("online-users", Array.from(onlineUsers.keys()));
    });

    socket.on("typing", (data) => {
        io.to(String(data.to)).emit("typing", { from: data.from, to: data.to });
    });

    socket.on("stop-typing", (data) => {
        io.to(String(data.to)).emit("stop-typing", { from: data.from, to: data.to });
    });

    // Pure WebSocket Message Sending (replaces HTTP)
    socket.on("send-text-message", async (payload) => {
        const from = socket.userId || payload.from;
        const { to, message, type, replyToMessageId, isGroup, tempId } = payload;

        try {
            const recipientOnline = onlineUsers.has(String(to));
            const { convo, message: newMsg } = await MessageService.addMessage({
                content: message,
                from,
                to,
                type: type || "text",
                replyToMessageId,
                isGroup,
                recipientOnline
            });

            SocketEmitter.emitMessageSent(convo, { ...newMsg, tempId });
        } catch (error) {
            console.error("Socket send-text-message error:", error);
            // Optional: emit an error back to sender
            io.to(String(from)).emit("message-error", { tempId, error: error.message });
        }
    });

    socket.on("send-location-message", async (payload) => {
        const from = socket.userId || payload.from;
        const { to, latitude, longitude, name, address, replyToMessageId, isGroup, tempId } = payload;

        try {
            const recipientOnline = onlineUsers.has(String(to));
            const contentPayload = { lat: Number(latitude), lng: Number(longitude), ...(name ? { name } : {}), ...(address ? { address } : {}) };

            const { convo, message: newMsg } = await MessageService.addMessage({
                content: JSON.stringify(contentPayload),
                from,
                to,
                type: "location",
                replyToMessageId,
                isGroup,
                recipientOnline
            });

            SocketEmitter.emitMessageSent(convo, { ...newMsg, tempId });
        } catch (error) {
            console.error("Socket send-location-message error:", error);
            io.to(String(from)).emit("message-error", { tempId, error: error.message });
        }
    });

    socket.on("edit-message", async (payload) => {
        const requesterId = socket.userId || payload.requesterId;
        const { messageId, content } = payload;
        try {
            const result = await MessageService.editMessage({ messageId, content, requesterId });
            result.participants.forEach(p => {
                if (p.userId) io.to(String(p.userId)).emit("message-edited", { messageId: result.id, newContent: result.content, editedAt: result.editedAt });
            });
        } catch (error) {
            console.error("Socket edit-message error:", error);
            io.to(String(requesterId)).emit("message-error", { error: error.message });
        }
    });

    socket.on("delete-message", async (payload) => {
        const requesterId = socket.userId || payload.requesterId;
        const { messageId, deleteType } = payload;
        try {
            const result = await MessageService.deleteMessage({ messageId, deleteType, requesterId });
            if (result.participants) {
                result.participants.forEach(p => {
                    if (p.userId) io.to(String(p.userId)).emit("message-deleted", { messageId: result.id, deleteType, deletedBy: result.deletedBy });
                });
            }
        } catch (error) {
            console.error("Socket delete-message error:", error);
            io.to(String(requesterId)).emit("message-error", { error: error.message });
        }
    });

    socket.on("react-message", async (payload) => {
        const requesterId = socket.userId || payload.requesterId;
        const { messageId, emoji } = payload;
        try {
            const result = await MessageService.reactToMessage({ messageId, emoji, requesterId });
            if (result.participants) {
                result.participants.forEach(p => {
                    if (p.userId) io.to(String(p.userId)).emit("message-reacted", { messageId: result.messageId, emoji: result.emoji, userId: result.userId, action: result.action, reactions: result.reactions });
                });
            }
        } catch (error) {
            console.error("Socket react-message error:", error);
            io.to(String(requesterId)).emit("message-error", { error: error.message });
        }
    });

    socket.on("forward-messages", async (payload, callback) => {
        const requesterId = socket.userId || payload.requesterId;
        const { messageIds, toConversationIds } = payload;
        try {
            const { emits } = await MessageService.forwardMessages({ messageIds, toConversationIds, requesterId });
            if (emits) {
                emits.forEach(e => {
                    // Use standard emitMessageSent for consistency across all message types
                    SocketEmitter.emitMessageSent(e.conversation, e);
                });
            }
            if (typeof callback === "function") callback({ success: true });
        } catch (error) {
            console.error("Socket forward-messages error:", error);
            io.to(String(requesterId)).emit("message-error", { error: error.message });
            if (typeof callback === "function") callback({ success: false, error: error.message });
        }
    });

    socket.on("mark-delivered", async ({ messageId, senderId }) => {
        if (!messageId || !senderId) return;
        try {
            const result = await MessageService.updateMessageStatus({ messageId, status: "delivered" });
            if (result.participants) {
                result.participants.forEach(p => {
                    if (p.userId) io.to(String(p.userId)).emit("message-status-update", { messageId: result.id, status: result.status, conversationId: result.conversationId });
                });
            }
        } catch (error) {
            console.error("Error updating status to delivered via socket:", error);
        }
    });

    socket.on("mark-read", async ({ messageId, senderId }) => {
        if (!messageId || !senderId) return;
        try {
            const result = await MessageService.updateMessageStatus({ messageId, status: "read", readerId: socket.userId });
            if (result.participants) {
                result.participants.forEach(p => {
                    if (p.userId) io.to(String(p.userId)).emit("message-status-update", { messageId: result.id, status: result.status, conversationId: result.conversationId });
                });
            }
        } catch (error) {
            console.error("Error updating status to read via socket:", error);
        }
    });

    // Explicit signout: remove mapping and notify others
    socket.on("signout", (userId) => {
        try {
            const uidStr = String(userId);
            if (onlineUsers.has(uidStr)) {
                onlineUsers.delete(uidStr);
                socket.broadcast.emit("user-offline", { userId: uidStr });
            }
            // terminate this socket connection
            socket.disconnect(true);
        } catch (_) { }
    });

    socket.on("disconnect", () => {
        // Find user by decrementing count
        for (const [uidStr, count] of onlineUsers.entries()) {
            // We need a better way to track this socket's userId.
            // Let's modify add-user to attach userId to the socket object.
            if (socket.userId === uidStr) {
                const newCount = count - 1;
                if (newCount <= 0) {
                    onlineUsers.delete(uidStr);
                    socket.broadcast.emit("user-offline", { userId: uidStr });
                } else {
                    onlineUsers.set(uidStr, newCount);
                }
                break;
            }
        }
    });
}
