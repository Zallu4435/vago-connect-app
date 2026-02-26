import getPrismaInstance from "../utils/PrismaClient.js";
import { uploadBuffer, deleteCloudinaryFile } from "../utils/Cloudinary.js";
import {
    getOrCreateDirectConversation,
    isBlockedBetweenUsers,
    resolveConversation,
    unhideConversationParticipants,
    buildMediaFileData,
    prepareReply
} from "../utils/messageHelpers.js";

import { SocketEmitter } from "../utils/SocketEmitter.js";

export class MessageService {
    static async addMessage({ content, from, to, type = "text", replyToMessageId, isGroup, recipientOnline }) {
        const prisma = getPrismaInstance();
        let blocked = false;
        if (!isGroup) {
            blocked = await isBlockedBetweenUsers(prisma, from, to);
        }
        if (blocked) throw Object.assign(new Error("Cannot send message. User is blocked."), { status: 403 });

        const convo = await resolveConversation(prisma, from, to, isGroup);
        const replyData = await prepareReply(prisma, convo.id, replyToMessageId, Number(from));

        const newMessage = await prisma.message.create({
            data: {
                conversationId: convo.id,
                senderId: Number(from),
                type,
                content,
                status: recipientOnline ? "delivered" : "sent",
                replyToMessageId: replyData.replyToMessageId,
                quotedMessage: replyData.quotedMessage,
            },
        });

        await prisma.conversationParticipant.updateMany({
            where: { conversationId: convo.id, userId: { not: Number(from) } },
            data: { unreadCount: { increment: 1 } }
        });

        await unhideConversationParticipants(prisma, convo.id);
        return { convo, message: newMessage };
    }

    static async addMediaMessage({ file, from, to, type, replyToMessageId, caption, isGroup, recipientOnline }) {
        const prisma = getPrismaInstance();

        let resource_type = 'auto';
        if (type === 'video') resource_type = 'video';
        if (type === 'image') resource_type = 'image';

        const cld = await uploadBuffer(file.buffer, {
            folder: process.env.CLOUDINARY_FOLDER || undefined,
            resource_type
        });

        const durationSec = cld?.duration ? Number(cld.duration) : null;
        if (type === 'video' && durationSec && durationSec > 90) {
            deleteCloudinaryFile(cld.public_id, 'video');
            throw Object.assign(new Error("Video duration exceeds 90 seconds"), { status: 400 });
        }

        const contentUrl = cld.secure_url;

        try {
            let blocked = false;
            if (!isGroup) {
                blocked = await isBlockedBetweenUsers(prisma, from, to);
            }
            if (blocked) throw Object.assign(new Error("Cannot send message. User is blocked."), { status: 403 });

            const convo = await resolveConversation(prisma, from, to, isGroup);
            const replyData = await prepareReply(prisma, convo.id, replyToMessageId, Number(from));

            const newMessage = await prisma.message.create({
                data: {
                    conversationId: convo.id,
                    senderId: Number(from),
                    type,
                    content: contentUrl,
                    status: recipientOnline ? "delivered" : "sent",
                    caption: caption && String(caption).trim() ? String(caption).trim() : null,
                    ...(durationSec ? { duration: Math.round(durationSec) } : {}),
                    replyToMessageId: replyData.replyToMessageId,
                    quotedMessage: replyData.quotedMessage,
                },
            });

            try { await prisma.mediaFile.create({ data: buildMediaFileData(newMessage.id, cld, file) }); } catch (_) { }

            await prisma.conversationParticipant.updateMany({
                where: { conversationId: convo.id, userId: { not: Number(from) } },
                data: { unreadCount: { increment: 1 } }
            });

            await unhideConversationParticipants(prisma, convo.id);

            return { convo, message: newMessage };
        } catch (insertError) {
            try {
                await deleteCloudinaryFile(cld.public_id, resource_type);
            } catch (cleanError) {
                console.error(`Failed to scrub orphaned ${type}`, cleanError);
            }
            throw insertError;
        }
    }

    static async getMessages({ from, to, isGroup, limit, cursorId, direction, markRead }) {
        const prisma = getPrismaInstance();
        let convo;
        if (isGroup) {
            convo = await prisma.conversation.findUnique({ where: { id: Number(to) } });
            if (!convo || convo.type !== 'group') {
                throw Object.assign(new Error("Group not found"), { status: 404 });
            }
        } else {
            convo = await getOrCreateDirectConversation(prisma, from, to);
        }

        const participant = await prisma.conversationParticipant.findFirst({
            where: { conversationId: convo.id, userId: Number(from) },
            select: { clearedAt: true },
        });
        const clearedAt = participant?.clearedAt || null;

        const rows = await prisma.message.findMany({
            where: {
                conversationId: convo.id,
                ...(clearedAt ? { createdAt: { gt: clearedAt } } : {}),
                NOT: {
                    deletedBy: { array_contains: Number(from) },
                },
            },
            orderBy: { createdAt: direction },
            take: limit + 1,
            ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
            include: {
                sender: { select: { id: true, name: true, profileImage: true } },
                reactions: {
                    include: {
                        user: { select: { id: true, name: true, profileImage: true } }
                    }
                }
            }
        });

        let nextCursor = null;
        let page = rows;
        if (rows.length > limit) {
            const next = rows.pop();
            nextCursor = next?.id ? String(next.id) : null;
            page = rows;
        }

        const messages = direction === 'desc' ? page.slice().reverse() : page;

        let unreadMessages = [];
        if (markRead) {
            const otherUserId = Number(to);
            const pending = messages.filter((m) => m.senderId === otherUserId && m.status !== 'read').map((m) => m.id);
            if (pending.length) {
                await prisma.message.updateMany({ where: { id: { in: pending } }, data: { status: 'read' } });
                unreadMessages = pending;

                await prisma.conversationParticipant.updateMany({
                    where: { conversationId: convo.id, userId: Number(from) },
                    data: { unreadCount: 0 }
                });

                SocketEmitter.emitToUser(otherUserId, 'messages-read', {
                    conversationId: convo.id,
                    readerId: Number(from),
                    messageIds: pending
                });
            }
        }

        return { messages, nextCursor, unreadMessages: markRead ? unreadMessages : undefined };
    }

    static async reactToMessage({ messageId, emoji, requesterId }) {
        const prisma = getPrismaInstance();
        const message = await prisma.message.findUnique({
            where: { id: messageId },
            include: { conversation: { include: { participants: true } }, reactions: true },
        });
        if (!message) throw Object.assign(new Error("Message not found"), { status: 404 });

        const isParticipant = message.conversation.participants.some(p => p.userId === requesterId);
        if (!isParticipant) throw Object.assign(new Error("Not a participant"), { status: 403 });

        const existing = await prisma.messageReaction.findUnique({
            where: { messageId_userId: { messageId, userId: requesterId } },
        });

        let action = "created";
        if (!existing) {
            await prisma.messageReaction.create({
                data: { messageId, userId: requesterId, emoji },
            });
        } else if (existing.emoji === emoji) {
            await prisma.messageReaction.delete({
                where: { messageId_userId: { messageId, userId: requesterId } },
            });
            action = "removed";
        } else {
            await prisma.messageReaction.update({
                where: { messageId_userId: { messageId, userId: requesterId } },
                data: { emoji },
            });
            action = "updated";
        }

        const reactions = await prisma.messageReaction.findMany({
            where: { messageId },
            include: { user: { select: { id: true, name: true, profileImage: true } } }
        });

        message.conversation.participants.forEach((p) => {
            SocketEmitter.emitToUser(p.userId, "message-reacted", { messageId, emoji, userId: requesterId, action, reactions });
        });

        return { messageId, reactions };
    }

    static async starMessage({ messageId, starred, requesterId }) {
        const prisma = getPrismaInstance();
        const message = await prisma.message.findUnique({
            where: { id: messageId },
            include: { conversation: { include: { participants: true } } },
        });
        if (!message) throw Object.assign(new Error("Message not found"), { status: 404 });

        const isParticipant = message.conversation.participants.some(p => p.userId === requesterId);
        if (!isParticipant) throw Object.assign(new Error("Not a participant"), { status: 403 });

        const arr = Array.isArray(message.starredBy) ? message.starredBy : [];
        let nextArr = arr;

        if (starred) {
            const exists = arr.some((e) => (e?.userId ?? e) === requesterId);
            if (!exists) {
                nextArr = [...arr, { userId: requesterId, starredAt: new Date().toISOString() }];
            }
        } else {
            nextArr = arr.filter((e) => (e?.userId ?? e) !== requesterId);
        }

        const updated = await prisma.message.update({
            where: { id: messageId },
            data: { starredBy: nextArr },
        });

        SocketEmitter.emitToUser(requesterId, "message-starred", { messageId: updated.id, starred });

        return { id: updated.id, starred };
    }

    static async editMessage({ messageId, content, requesterId }) {
        const prisma = getPrismaInstance();
        const message = await prisma.message.findUnique({
            where: { id: messageId },
            include: { conversation: { include: { participants: true } } },
        });
        if (!message) throw Object.assign(new Error("Message not found"), { status: 404 });

        if (message.senderId !== requesterId) {
            throw Object.assign(new Error("Only sender can edit this message"), { status: 403 });
        }
        if (message.isDeletedForEveryone) {
            throw Object.assign(new Error("Message was deleted"), { status: 400 });
        }
        const createdAt = new Date(message.createdAt).getTime();
        const now = Date.now();
        const fifteenMinutes = 15 * 60 * 1000;
        if (now - createdAt > fifteenMinutes) {
            throw Object.assign(new Error("Edit window expired"), { status: 400 });
        }

        const history = Array.isArray(message.editHistory) ? message.editHistory : [];
        history.push({ previousContent: message.content, editedAt: new Date().toISOString() });

        const updated = await prisma.message.update({
            where: { id: messageId },
            data: {
                content,
                isEdited: true,
                editedAt: new Date(),
                originalContent: message.originalContent ?? message.content,
                editHistory: history,
            },
        });

        const participantUserIds = message.conversation.participants.map(p => p.userId);
        participantUserIds.forEach((uid) => {
            SocketEmitter.emitToUser(uid, 'message-edited', { messageId: updated.id, newContent: updated.content, editedAt: updated.editedAt });
        });

        return { id: updated.id, content: updated.content, editedAt: updated.editedAt };
    }

    static async deleteMessage({ messageId, deleteType, requesterId }) {
        const prisma = getPrismaInstance();
        if (deleteType !== "forMe" && deleteType !== "forEveryone") {
            throw Object.assign(new Error("Invalid deleteType"), { status: 400 });
        }

        const message = await prisma.message.findUnique({
            where: { id: messageId },
            include: { conversation: { include: { participants: true } } },
        });

        if (!message) {
            return { id: messageId, deleteType: "forEveryone", status: 'idempotent' };
        }

        const isParticipant = message.conversation.participants.some(p => p.userId === requesterId);
        if (!isParticipant) throw Object.assign(new Error("Not a participant"), { status: 403 });

        if (deleteType === "forEveryone") {
            if (message.senderId !== requesterId) {
                throw Object.assign(new Error("Only sender can delete for everyone"), { status: 403 });
            }
            if (message.isDeletedForEveryone) {
                return { id: message.id, deleteType: "forEveryone", status: 'idempotent' };
            }
            const createdAt = new Date(message.createdAt).getTime();
            const fortyEightHours = 48 * 60 * 60 * 1000;
            if (Date.now() - createdAt > fortyEightHours) {
                throw Object.assign(new Error("Delete for everyone window expired"), { status: 400 });
            }

            const updated = await prisma.message.update({
                where: { id: messageId },
                data: {
                    isDeletedForEveryone: true,
                    deletedForEveryoneAt: new Date(),
                    content: "This message was deleted",
                },
            });

            const userIds = message.conversation.participants.map(p => p.userId);
            userIds.forEach((uid) => {
                SocketEmitter.emitToUser(uid, "message-deleted", { messageId: updated.id, deleteType: "forEveryone" });
            });

            return { id: updated.id, deleteType: "forEveryone" };
        }

        // forMe
        const deletedBy = Array.isArray(message.deletedBy) ? message.deletedBy : [];
        if (!deletedBy.includes(requesterId)) {
            deletedBy.push(requesterId);
        } else {
            return { message, status: 'idempotent' };
        }

        const updated = await prisma.message.update({
            where: { id: messageId },
            data: { deletedBy },
        });

        SocketEmitter.emitToUser(requesterId, "message-deleted", { messageId: updated.id, deleteType: "forMe", deletedBy });

        return { message: updated };
    }

    static async forwardMessages({ messageIds, toConversationIds, requesterId }) {
        const prisma = getPrismaInstance();

        const msgs = await prisma.message.findMany({
            where: { id: { in: messageIds.map(Number) } },
            include: {
                conversation: { include: { participants: true } },
                mediaFiles: true,
            },
        });
        if (msgs.length !== messageIds.length) {
            throw Object.assign(new Error("One or more messages not found"), { status: 404 });
        }

        for (const m of msgs) {
            const isParticipant = m.conversation.participants.some(p => p.userId === requesterId);
            if (!isParticipant) {
                throw Object.assign(new Error(`No access to source message ${m.id}`), { status: 403 });
            }
        }

        const destConvos = await prisma.conversation.findMany({
            where: { id: { in: toConversationIds.map(Number) } },
            include: { participants: true },
        });
        if (destConvos.length !== toConversationIds.length) {
            throw Object.assign(new Error(`One or more destination conversations not found`), { status: 404 });
        }
        for (const c of destConvos) {
            const isParticipant = c.participants.some(p => p.userId === requesterId);
            if (!isParticipant) {
                throw Object.assign(new Error(`No access to destination conversation ${c.id}`), { status: 403 });
            }
        }

        const created = [];

        for (const m of msgs) {
            for (const c of destConvos) {
                const newMsg = await prisma.message.create({
                    data: {
                        conversationId: c.id,
                        senderId: requesterId,
                        type: m.type,
                        content: m.content,
                        caption: m.caption,
                        fileName: m.fileName,
                        fileSize: m.fileSize,
                        mimeType: m.mimeType,
                        duration: m.duration,
                        thumbnailUrl: m.thumbnailUrl,
                        status: "sent",
                        isForwarded: true,
                        originalMessageId: m.id,
                        forwardCount: (m.forwardCount || 0) + 1,
                    },
                });

                if (m.mediaFiles && m.mediaFiles.length) {
                    for (const mf of m.mediaFiles) {
                        await prisma.mediaFile.create({
                            data: {
                                messageId: newMsg.id,
                                storageKey: mf.storageKey,
                                storageProvider: mf.storageProvider,
                                originalName: mf.originalName,
                                mimeType: mf.mimeType,
                                fileSize: mf.fileSize,
                                width: mf.width,
                                height: mf.height,
                                duration: mf.duration,
                                thumbnailKey: mf.thumbnailKey,
                                thumbnailSize: mf.thumbnailSize,
                                uploadStatus: mf.uploadStatus,
                                downloadCount: 0,
                                isCompressed: mf.isCompressed,
                                originalFileSize: mf.originalFileSize,
                                expiresAt: mf.expiresAt,
                                cloudinaryPublicId: mf.cloudinaryPublicId,
                                cloudinaryVersion: mf.cloudinaryVersion,
                                cloudinaryResourceType: mf.cloudinaryResourceType,
                                cloudinaryFormat: mf.cloudinaryFormat,
                                cloudinaryFolder: mf.cloudinaryFolder,
                                cloudinaryAssetId: mf.cloudinaryAssetId,
                            },
                        });
                    }
                }

                created.push({
                    id: newMsg.id,
                    conversationId: c.id,
                    senderId: requesterId,
                    type: newMsg.type,
                    content: newMsg.content,
                    status: newMsg.status,
                    createdAt: newMsg.createdAt,
                    isForwarded: true,
                    forwardCount: newMsg.forwardCount,
                });

                c.participants.forEach((p) => {
                    SocketEmitter.emitToUser(p.userId, "message-forwarded", { messageId: newMsg.id, conversationId: c.id });
                });
            }
        }

        return created;
    }

    static async updateMessageStatus({ messageId, status }) {
        const prisma = getPrismaInstance();
        const allowed = ["sent", "delivered", "read"];
        const idNum = parseInt(messageId);
        if (!idNum || !allowed.includes(status)) {
            throw Object.assign(new Error("Invalid payload"), { status: 400 });
        }
        const updated = await prisma.message.update({
            where: { id: idNum },
            data: { status },
            include: { conversation: { include: { participants: true } } },
        });

        SocketEmitter.emitToUser(updated.senderId, "message-status-update", { messageId: updated.id, status });
        const otherParticipant = updated.conversation.participants.find(p => p.userId !== updated.senderId);
        if (otherParticipant) {
            SocketEmitter.emitToUser(otherParticipant.userId, "message-status-update", { messageId: updated.id, status });
        }

        return { id: updated.id, status };
    }

    static async searchMessages({ conversationId, userId, q, limit = 30, cursorId }) {
        const prisma = getPrismaInstance();

        if (!conversationId) throw Object.assign(new Error("Invalid conversation id"), { status: 400 });

        const participant = await prisma.conversationParticipant.findFirst({
            where: { conversationId, userId }
        });

        if (!participant || participant.isDeleted) {
            throw Object.assign(new Error("Not a participant"), { status: 403 });
        }

        const clearedAt = participant.clearedAt || null;

        if (!q.trim()) {
            return [];
        }

        const rows = await prisma.message.findMany({
            where: {
                conversationId,
                isSystemMessage: false,
                ...(clearedAt ? { createdAt: { gt: clearedAt } } : {}),
                NOT: {
                    deletedBy: { array_contains: userId },
                },
                OR: [
                    { content: { contains: q, mode: 'insensitive' } },
                    { caption: { contains: q, mode: 'insensitive' } },
                    { fileName: { contains: q, mode: 'insensitive' } },
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
            include: {
                sender: { select: { id: true, name: true, profileImage: true } },
            }
        });

        let nextCursor = null;
        let messages = rows;
        if (rows.length > limit) {
            const nextItem = rows.pop();
            nextCursor = nextItem?.id ? String(nextItem.id) : null;
            messages = rows;
        }

        return { messages, nextCursor };
    }
}
