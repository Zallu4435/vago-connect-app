import getPrismaInstance from "../utils/PrismaClient.js";
import { uploadBuffer, deleteCloudinaryFile } from "../utils/Cloudinary.js";
import {
    getOrCreateDirectConversation,
    isBlockedBetweenUsers,
    resolveConversation,
    unhideConversationParticipants,
    buildMediaFileData,
    prepareReply,
    isWithinDeletionWindow
} from "../utils/messageHelpers.js";


export class MessageService {
    static async addMessage({ content, from, to, type = "text", replyToMessageId, isGroup, recipientOnline }) {
        const prisma = getPrismaInstance();
        let blocked = false;
        if (!isGroup) {
            blocked = await isBlockedBetweenUsers(prisma, from, to);
        }
        if (blocked) throw Object.assign(new Error("Cannot send message. User is blocked."), { status: 403 });

        return await prisma.$transaction(async (tx) => {
            const convo = await resolveConversation(tx, from, to, isGroup);
            const replyData = await prepareReply(tx, convo.id, replyToMessageId, Number(from));

            const newMessage = await tx.message.create({
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

            await tx.conversationParticipant.updateMany({
                where: { conversationId: convo.id, userId: { not: Number(from) } },
                data: { unreadCount: { increment: 1 } }
            });

            await unhideConversationParticipants(tx, convo.id);
            return { convo, message: newMessage };
        }, { timeout: 15000 });
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

            return await prisma.$transaction(async (tx) => {
                const convo = await resolveConversation(tx, from, to, isGroup);
                const replyData = await prepareReply(tx, convo.id, replyToMessageId, Number(from));

                const newMessage = await tx.message.create({
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

                await tx.mediaFile.create({ data: buildMediaFileData(newMessage.id, cld, file) });

                await tx.conversationParticipant.updateMany({
                    where: { conversationId: convo.id, userId: { not: Number(from) } },
                    data: { unreadCount: { increment: 1 } }
                });

                await unhideConversationParticipants(tx, convo.id);

                return { convo, message: newMessage };
            }, { timeout: 15000 });
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
        let emitRead = null;
        if (markRead) {
            const otherUserId = Number(to);
            const pending = messages.filter((m) => m.senderId === otherUserId && m.status !== 'read').map((m) => m.id);
            if (pending.length) {
                await prisma.$transaction([
                    prisma.message.updateMany({ where: { id: { in: pending } }, data: { status: 'read' } }),
                    prisma.conversationParticipant.updateMany({
                        where: { conversationId: convo.id, userId: Number(from) },
                        data: { unreadCount: 0 }
                    })
                ]);
                unreadMessages = pending;

                emitRead = {
                    otherUserId,
                    payload: {
                        conversationId: convo.id,
                        readerId: Number(from),
                        messageIds: pending
                    }
                };
            }
        }

        return { messages, nextCursor, unreadMessages: markRead ? unreadMessages : undefined, emitRead };
    }

    static async reactToMessage({ messageId, emoji, requesterId }) {
        const prisma = getPrismaInstance();
        const mId = Number(messageId);
        const reqId = Number(requesterId);
        if (isNaN(mId) || mId > 2147483647) throw Object.assign(new Error("Message is still sending or invalid"), { status: 400 });

        // 1. Initial validation outside the transaction to release pressure
        const message = await prisma.message.findUnique({
            where: { id: mId },
            include: { conversation: { include: { participants: true } } },
        });
        if (!message) throw Object.assign(new Error("Message not found"), { status: 404 });

        const isParticipant = message.conversation.participants.some(p => p.userId === reqId);
        if (!isParticipant) throw Object.assign(new Error("Not a participant"), { status: 403 });

        if (message.conversation.type === 'direct') {
            const other = message.conversation.participants.find(p => p.userId !== reqId);
            if (other && await isBlockedBetweenUsers(prisma, reqId, other.userId)) {
                throw Object.assign(new Error("Cannot react to message. Contact is blocked."), { status: 403 });
            }
        }

        // 2. Perform the reaction update in a focused transaction
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.messageReaction.findUnique({
                where: { messageId_userId: { messageId: mId, userId: reqId } },
            });

            let action = "created";
            if (!existing) {
                await tx.messageReaction.create({
                    data: { messageId: mId, userId: reqId, emoji },
                });
            } else if (existing.emoji === emoji) {
                await tx.messageReaction.delete({
                    where: { messageId_userId: { messageId: mId, userId: reqId } },
                });
                action = "removed";
            } else {
                await tx.messageReaction.update({
                    where: { messageId_userId: { messageId: mId, userId: reqId } },
                    data: { emoji },
                });
                action = "updated";
            }

            // Fetch all reactions for the response
            const reactions = await tx.messageReaction.findMany({
                where: { messageId: mId },
                include: { user: { select: { id: true, name: true, profileImage: true } } }
            });

            return { messageId: mId, emoji, userId: reqId, action, reactions, participants: message.conversation.participants };
        }, { timeout: 30000 }); // Increased timeout to give queue more time if pool is full
    }

    static async starMessage({ messageId, starred, requesterId }) {
        const prisma = getPrismaInstance();
        const mId = Number(messageId);
        const reqId = Number(requesterId);
        if (isNaN(mId) || mId > 2147483647) throw Object.assign(new Error("Message is still sending or invalid"), { status: 400 });

        const message = await prisma.message.findUnique({
            where: { id: mId },
            include: { conversation: { include: { participants: true } } },
        });
        if (!message) throw Object.assign(new Error("Message not found"), { status: 404 });

        const isParticipant = message.conversation.participants.some(p => p.userId === reqId);
        if (!isParticipant) throw Object.assign(new Error("Not a participant"), { status: 403 });

        if (message.conversation.type === 'direct') {
            const other = message.conversation.participants.find(p => p.userId !== reqId);
            if (other && await isBlockedBetweenUsers(prisma, reqId, other.userId)) {
                throw Object.assign(new Error("Cannot star message. Contact is blocked."), { status: 403 });
            }
        }

        return await prisma.$transaction(async (tx) => {
            const arr = Array.isArray(message.starredBy) ? message.starredBy : [];
            let nextArr = arr;

            if (starred) {
                const exists = arr.some((e) => (e?.userId ?? e) === reqId);
                if (!exists) {
                    nextArr = [...arr, { userId: reqId, starredAt: new Date().toISOString() }];
                }
            } else {
                nextArr = arr.filter((e) => (e?.userId ?? e) !== reqId);
            }

            const updated = await tx.message.update({
                where: { id: mId },
                data: { starredBy: nextArr },
            });

            return { id: updated.id, starred, participants: message.conversation.participants };
        }, { timeout: 30000 });
    }

    static async editMessage({ messageId, content, requesterId }) {
        const prisma = getPrismaInstance();
        const mId = Number(messageId);
        const reqId = Number(requesterId);
        if (isNaN(mId) || mId > 2147483647) throw Object.assign(new Error("Message is still sending. Please wait a moment."), { status: 400 });

        const message = await prisma.message.findUnique({
            where: { id: mId },
            include: { conversation: { include: { participants: true } } },
        });
        if (!message) throw Object.assign(new Error("Message not found"), { status: 404 });

        if (message.senderId !== reqId) {
            throw Object.assign(new Error("Only sender can edit this message"), { status: 403 });
        }

        if (message.conversation.type === 'direct') {
            const other = message.conversation.participants.find(p => p.userId !== reqId);
            if (other && await isBlockedBetweenUsers(prisma, reqId, other.userId)) {
                throw Object.assign(new Error("Cannot edit message. Contact is blocked."), { status: 403 });
            }
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

        return await prisma.$transaction(async (tx) => {
            const history = Array.isArray(message.editHistory) ? message.editHistory : [];
            history.push({ previousContent: message.content, editedAt: new Date().toISOString() });

            const updated = await tx.message.update({
                where: { id: mId },
                data: {
                    content,
                    isEdited: true,
                    editedAt: new Date(),
                    originalContent: message.originalContent ?? message.content,
                    editHistory: history,
                },
            });

            return { id: updated.id, content: updated.content, editedAt: updated.editedAt, participants: message.conversation.participants };
        }, { timeout: 30000 });
    }

    static async deleteMessage({ messageId, deleteType, requesterId }) {
        const prisma = getPrismaInstance();
        const mId = Number(messageId);
        const reqId = Number(requesterId);
        if (isNaN(mId) || mId > 2147483647) throw Object.assign(new Error("Message is still sending. Please wait a moment."), { status: 400 });

        if (deleteType !== "forMe" && deleteType !== "forEveryone") {
            throw Object.assign(new Error("Invalid deleteType"), { status: 400 });
        }

        const message = await prisma.message.findUnique({
            where: { id: mId },
            include: {
                conversation: { include: { participants: true } },
                mediaFiles: true
            },
        });

        if (!message) {
            return { id: mId, deleteType: "forEveryone", status: 'idempotent' };
        }

        const isParticipant = message.conversation.participants.some(p => p.userId === reqId);
        if (!isParticipant) throw Object.assign(new Error("Not a participant"), { status: 403 });

        if (deleteType === "forEveryone") {
            if (message.senderId !== reqId) {
                throw Object.assign(new Error("Only sender can delete for everyone"), { status: 403 });
            }

            if (message.conversation.type === 'direct') {
                const other = message.conversation.participants.find(p => p.userId !== reqId);
                if (other && await isBlockedBetweenUsers(prisma, reqId, other.userId)) {
                    throw Object.assign(new Error("Cannot delete for everyone. Contact is blocked."), { status: 403 });
                }
            }

            if (message.isDeletedForEveryone) {
                return { id: message.id, deleteType: "forEveryone", status: 'idempotent' };
            }
            if (!isWithinDeletionWindow(message.createdAt)) {
                throw Object.assign(new Error("Delete for everyone window expired"), { status: 400 });
            }

            // Perform Cloudinary cleanup before database update
            if (message.mediaFiles && message.mediaFiles.length > 0) {
                for (const mf of message.mediaFiles) {
                    if (mf.storageProvider === 'cloudinary' && mf.cloudinaryPublicId) {
                        // CHECK: Are any OTHER media records using the same publicId? (e.g. forwards or copies)
                        const others = await prisma.mediaFile.count({
                            where: {
                                cloudinaryPublicId: mf.cloudinaryPublicId,
                                id: { not: mf.id }
                            }
                        });

                        // If no other message uses it, we can safely delete from cloud storage
                        if (others === 0) {
                            try {
                                await deleteCloudinaryFile(mf.cloudinaryPublicId, mf.cloudinaryResourceType || 'image');
                            } catch (cldErr) {
                                console.error(`[MessageService:delete] Cloudinary delete failed for ${mf.cloudinaryPublicId}`, { error: cldErr });
                                // We don't throw; we finish the DB update even if cloud deletion fails
                            }
                        }
                    }
                }
            }

            // forEveryone: Atomic update (Atomic by default in Prisma single operations)
            const updated = await prisma.message.update({
                where: { id: mId },
                data: {
                    isDeletedForEveryone: true,
                    deletedForEveryoneAt: new Date(),
                    content: "This message was deleted",
                },
            });

            return { id: updated.id, deleteType: "forEveryone", participants: message.conversation.participants };
        } else {
            // forMe: Use a simple read-then-update without a long-lasting interactive transaction
            // while not strictly atomic against concurrent "forMe" from other users, 
            // "forMe" is user-specific, so concurrent "forMe" on the same message for the same user is impossible.
            const currentMsg = await prisma.message.findUnique({ where: { id: mId }, select: { deletedBy: true } });
            const deleted = Array.isArray(currentMsg?.deletedBy) ? [...currentMsg.deletedBy] : [];
            const reqIdNum = Number(reqId);
            if (!deleted.includes(reqIdNum)) {
                deleted.push(reqIdNum);
            }
            const updated = await prisma.message.update({
                where: { id: mId },
                data: { deletedBy: deleted },
            });
            return { id: updated.id, deleteType: "forMe", participants: message.conversation.participants, deletedBy: deleted };
        }
    }

    static async forwardMessages({ messageIds, toConversationIds, requesterId }) {
        const prisma = getPrismaInstance();
        const reqId = Number(requesterId);

        // 1. Resolve source messages and destination conversations outside transaction
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
            const isParticipant = m.conversation.participants.some(p => p.userId === reqId);
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
            const isParticipant = c.participants.some(p => p.userId === reqId);
            if (!isParticipant) {
                throw Object.assign(new Error(`No access to destination conversation ${c.id}`), { status: 403 });
            }

            if (c.type === 'direct') {
                const other = c.participants.find(p => p.userId !== reqId);
                if (other && await isBlockedBetweenUsers(prisma, reqId, other.userId)) {
                    throw Object.assign(new Error(`Cannot forward to blocked contact`), { status: 403 });
                }
            }
        }

        // 2. Perform creations in a transaction
        return await prisma.$transaction(async (tx) => {
            const created = [];
            let emits = [];

            for (const m of msgs) {
                for (const c of destConvos) {
                    const newMsg = await tx.message.create({
                        data: {
                            conversationId: c.id,
                            senderId: reqId,
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
                            await tx.mediaFile.create({
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

                    const emitData = {
                        ...newMsg,
                        isForwarded: true,
                        forwardCount: newMsg.forwardCount,
                        conversation: {
                            id: c.id,
                            type: c.type,
                            participants: c.participants
                        }
                    };

                    created.push(emitData);
                    emits.push(emitData);
                }
            }

            return { created, emits };
        }, { timeout: 60000 }); // Large timeout for bulk forwarding
    }

    static async updateMessageStatus({ messageId, status, readerId }) {
        const prisma = getPrismaInstance();
        const allowed = ["sent", "delivered", "read"];
        const idNum = parseInt(messageId);
        if (!idNum || !allowed.includes(status)) {
            throw Object.assign(new Error("Invalid payload"), { status: 400 });
        }
        return await prisma.$transaction(async (tx) => {
            const updated = await tx.message.update({
                where: { id: idNum },
                data: { status },
                include: { conversation: { include: { participants: true } } },
            });

            if (status === 'read' && readerId) {
                await tx.conversationParticipant.updateMany({
                    where: { conversationId: updated.conversationId, userId: Number(readerId) },
                    data: { unreadCount: 0 }
                });
            }

            return {
                id: updated.id,
                status,
                senderId: updated.senderId,
                conversationId: updated.conversationId,
                participants: updated.conversation.participants
            };
        }, { timeout: 30000 });
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
