export function handleChatEvents(io, socket, onlineUsers) {
    socket.on("add-user", (userId) => {
        onlineUsers.set(String(userId), socket.id);
        socket.broadcast.emit("user-online", { userId });
        io.emit("online-users", Array.from(onlineUsers.keys()));
    });

    socket.on("send-msg", (data) => {
        const sendUserSocket = onlineUsers.get(String(data.to));
        if (sendUserSocket) {
            // Use io.to() instead of socket.to() so it doesn't exclude the sender
            // This is critical for "You" self-chats where to === from.
            io.to(sendUserSocket).emit("msg-recieve", {
                from: data.from,
                message: data.message,
                type: data.type || "text",
                messageId: data.messageId,
                replyToMessageId: data.replyToMessageId,
                quotedMessage: data.quotedMessage,
                caption: data.caption,
            });
        }
    });

    // Explicit signout: remove mapping and notify others
    socket.on("signout", (userId) => {
        try {
            const uidStr = String(userId);
            if (onlineUsers.has(uidStr)) {
                onlineUsers.delete(uidStr);
                socket.broadcast.emit("user-offline", { userId: uidStr });
                io.emit("online-users", Array.from(onlineUsers.keys()));
            }
            // terminate this socket connection
            socket.disconnect(true);
        } catch (_) { }
    });

    socket.on("disconnect", () => {
        // remove socket from onlineUsers map
        for (const [uid, sid] of onlineUsers.entries()) {
            if (sid === socket.id) {
                onlineUsers.delete(uid);
                socket.broadcast.emit("user-offline", { userId: uid });
                io.emit("online-users", Array.from(onlineUsers.keys()));
                break;
            }
        }
    });
}
