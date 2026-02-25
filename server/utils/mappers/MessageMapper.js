export class MessageMapper {
    static toMinimalMessage(m) {
        if (!m) return m;
        return {
            id: m.id,
            conversationId: m.conversationId,
            senderId: m.senderId,
            type: m.type,
            content: m.content,
            caption: m.caption || undefined,
            status: m.status,
            createdAt: m.createdAt,
            ...(m.replyToMessageId ? { replyToMessageId: m.replyToMessageId } : {}),
            ...(m.quotedMessage ? { quotedMessage: m.quotedMessage } : {}),
            ...(m.isForwarded ? { isForwarded: m.isForwarded } : {}),
        };
    }

    static toConversationListItem(p, userId) {
        const convo = p.conversation;
        const clearedAt = p.clearedAt ? new Date(p.clearedAt).getTime() : 0;
        const validMessages = (convo.messages || []).filter(m => new Date(m.createdAt).getTime() > clearedAt);
        const lastMsg = validMessages[0] || null;
        const other = convo.type === 'direct' ? (convo.participants.find(cp => cp.userId !== userId)?.user || convo.participants.find(cp => cp.userId === userId)?.user) : null;

        return {
            conversationId: convo.id,
            type: convo.type,
            createdById: convo.createdById,
            participants: (convo.participants || []).filter(p => !p.leftAt).map(p => ({
                userId: p.userId,
                role: p.role,
                user: p.user ? {
                    id: p.user.id,
                    name: p.user.name,
                    email: p.user.email,
                    profileImage: p.user.profileImage
                } : null
            })),
            groupName: convo.groupName,
            groupDescription: convo.groupDescription,
            groupIcon: convo.groupIcon,
            lastMessage: lastMsg ? {
                id: lastMsg.id,
                type: lastMsg.type,
                message: lastMsg.type === 'text' ? lastMsg.content : '',
                status: lastMsg.status,
                timestamp: lastMsg.createdAt,
                senderId: lastMsg.senderId,
                isSystemMessage: lastMsg.isSystemMessage || false,
                systemMessageType: lastMsg.systemMessageType || null,
            } : null,
            participantState: {
                isPinned: p.isPinned,
                isMuted: p.isMuted,
                isArchived: p.isArchived,
                unreadCount: p.unreadCount,
            },
            user: other ? {
                id: other.id,
                name: other.name,
                email: other.email,
                about: other.about,
                profileImage: other.profileImage,
            } : null,
        };
    }

    static toCallHistoryItem(msg) {
        const otherParticipant = msg.conversation?.participants.find(p => p.userId !== msg.senderId);
        const receiverUser = otherParticipant ? otherParticipant.user : null;

        return {
            ...msg,
            receiverId: receiverUser?.id || null,
            receiver: receiverUser,
            conversation: undefined // Omit giant conversation obj from payload
        };
    }
}
