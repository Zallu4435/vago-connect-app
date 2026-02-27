/**
 * Utility to encapsulate Socket.IO event emission.
 * Checks for global.io and global.onlineUsers before emitting.
 */
export class SocketEmitter {
    static emitToUser(userId, event, payload) {
        try {
            if (global?.io && global?.onlineUsers) {
                // Now that users join rooms named by their userId, we can emit directly to the room.
                // We still check if they are "online" (in the map) to avoid unnecessary work, 
                // but we emit to the room (which broadcasts to all their active tabs/devices).
                const uidStr = String(userId);
                if (global.onlineUsers.has(uidStr)) {
                    global.io.to(uidStr).emit(event, payload);
                    return true;
                }
            }
        } catch (error) {
            console.error(`SocketEmitter: Failed to emit ${event} to user ${userId}`, error);
        }
        return false;
    }

    /**
     * Emit a 'message-sent' event to all participants of a conversation.
     * @param {object} conversation
     * @param {object} message
     */
    static emitMessageSent(conversation, message) {
        if (!conversation || !Array.isArray(conversation.participants)) return;

        const isDirect = conversation.type === 'direct';
        const senderId = Number(message.senderId);

        const isGroup = conversation.type === 'group';

        conversation.participants.forEach(p => {
            const uid = Number(p.userId);
            if (!uid) return;

            // If it's a group, only send to those who haven't left
            if (isGroup && p.leftAt) return;

            // For direct messages, try to inject receiverId if missing so frontend can match accurately
            let payload = { ...message };
            if (isDirect && !payload.receiverId) {
                const other = conversation.participants.find(part => Number(part.userId) !== senderId);
                if (other) payload.receiverId = Number(other.userId);
                else payload.receiverId = senderId; // Self-chat case
            }

            this.emitToUser(uid, "message-sent", { message: payload });
        });
    }

    /**
     * Emit an event to an array of user IDs.
     * @param {Array<number|string>} userIds 
     * @param {string} event 
     * @param {any} payload 
     */
    static emitToUsers(userIds, event, payload) {
        if (!Array.isArray(userIds)) return;
        userIds.forEach(uid => this.emitToUser(uid, event, payload));
    }
}
