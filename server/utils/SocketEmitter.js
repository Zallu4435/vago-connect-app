/**
 * Utility to encapsulate Socket.IO event emission.
 * Checks for global.io and global.onlineUsers before emitting.
 */
export class SocketEmitter {
    /**
     * Emit an event to a specific user by their ID.
     * @param {number|string} userId - The user ID to emit to.
     * @param {string} event - The socket event name.
     * @param {any} payload - The event payload.
     */
    static emitToUser(userId, event, payload) {
        try {
            if (global?.io && global?.onlineUsers) {
                const sid = global.onlineUsers.get(String(userId)) || global.onlineUsers.get(userId);
                if (sid) {
                    global.io.to(sid).emit(event, payload);
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
        conversation.participants.forEach(p => {
            this.emitToUser(p.userId, "message-sent", { message });
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
