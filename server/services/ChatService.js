import getPrismaInstance from "../utils/PrismaClient.js";
import { uploadBuffer, deleteCloudinaryFile } from "../utils/Cloudinary.js";
import { SocketEmitter } from "../utils/SocketEmitter.js";
import { ChatMapper } from "../utils/mappers/ChatMapper.js";

export class ChatService {
    static async createGroup({ creatorId, groupName, groupDescription, groupIconUrl, memberIds, file }) {
        const prisma = getPrismaInstance();

        if (!groupName || typeof groupName !== "string" || !groupName.trim()) {
            throw Object.assign(new Error("groupName is required"), { status: 400 });
        }

        if (typeof memberIds === 'string') memberIds = [memberIds];
        if (!Array.isArray(memberIds) || memberIds.length < 1) {
            throw Object.assign(new Error("memberIds must contain at least one user"), { status: 400 });
        }
        memberIds = [...new Set(memberIds.map((id) => Number(id)).filter((n) => !isNaN(n) && n !== creatorId))];
        if (memberIds.length < 1) {
            throw Object.assign(new Error("memberIds cannot be empty or contain only the creator"), { status: 400 });
        }
        if (memberIds.length > 19) {
            throw Object.assign(new Error("A group cannot have more than 20 members (including the creator)"), { status: 400 });
        }

        const users = await prisma.user.findMany({ where: { id: { in: memberIds } }, select: { id: true } });
        const validIds = new Set(users.map((u) => u.id));
        const invalid = memberIds.filter((id) => !validIds.has(id));
        if (invalid.length) {
            throw Object.assign(new Error(`Invalid memberIds: ${invalid.join(",")}`), { status: 400 });
        }

        let iconUrl = undefined;
        let iconPublicId = undefined;
        if (file && file.buffer) {
            const cld = await uploadBuffer(file.buffer, {
                folder: process.env.CLOUDINARY_FOLDER || undefined,
                resource_type: "image",
            });
            iconUrl = cld.secure_url;
            iconPublicId = cld.public_id;
        } else if (typeof groupIconUrl === "string" && groupIconUrl.trim()) {
            iconUrl = groupIconUrl.trim();
        }

        try {
            const conversation = await prisma.conversation.create({
                data: {
                    type: "group",
                    groupName: groupName.trim(),
                    groupDescription: typeof groupDescription === "string" ? groupDescription.trim() : null,
                    groupIcon: iconUrl || null,
                    createdById: creatorId,
                    participants: {
                        create: [
                            { userId: creatorId, role: "admin" },
                            ...memberIds.map((id) => ({ userId: id, role: "member" })),
                        ],
                    },
                },
                include: { participants: { include: { user: { select: { id: true, name: true, profileImage: true } } } } },
            });

            const sysMsg = await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    senderId: creatorId,
                    type: 'text',
                    content: `Group created`,
                    isSystemMessage: true,
                    systemMessageType: 'group_created',
                    status: 'sent',
                },
            });

            SocketEmitter.emitToUsers(conversation.participants.map((p) => p.userId), "group-created", {
                conversation: {
                    id: conversation.id,
                    type: conversation.type,
                    groupName: conversation.groupName,
                    groupDescription: conversation.groupDescription,
                    groupIcon: conversation.groupIcon,
                    createdAt: conversation.createdAt,
                    participants: ChatMapper.mapParticipantsToMinimal(conversation.participants),
                },
            });

            return {
                id: conversation.id,
                groupName: conversation.groupName,
                groupDescription: conversation.groupDescription,
                groupIcon: conversation.groupIcon,
                createdAt: conversation.createdAt,
                participants: ChatMapper.mapParticipantsToMinimal(conversation.participants),
            };
        } catch (error) {
            if (iconPublicId) {
                try {
                    await deleteCloudinaryFile(iconPublicId, 'image');
                } catch (cleanupError) {
                    console.error("Failed to scrub orphaned group icon during creation:", cleanupError);
                }
            }
            throw error;
        }
    }

    static async addGroupMembers({ adminId, groupId, members }) {
        const prisma = getPrismaInstance();
        if (!groupId || !Array.isArray(members) || members.length === 0) {
            throw Object.assign(new Error("groupId and members are required"), { status: 400 });
        }
        members = [...new Set(members.map((id) => Number(id)).filter((n) => !isNaN(n) && n !== adminId))];
        if (members.length === 0) throw Object.assign(new Error("No valid members to add"), { status: 400 });

        const convo = await prisma.conversation.findUnique({
            where: { id: groupId },
            include: { participants: true },
        });
        if (!convo || convo.type !== 'group') throw Object.assign(new Error("Group not found"), { status: 404 });
        const adminPart = convo.participants.find((p) => p.userId === adminId);
        if (!adminPart || adminPart.role !== 'admin') throw Object.assign(new Error("Only admins can add members"), { status: 403 });

        const existingIds = new Set(convo.participants.filter((p) => !p.leftAt).map((p) => p.userId));
        const toAddIds = members.filter((id) => !existingIds.has(id));
        if (toAddIds.length === 0) {
            return { participants: convo.participants };
        }

        if (existingIds.size + toAddIds.length > 20) {
            throw Object.assign(new Error(`Adding these members would exceed the 20 member limit. You can only add ${20 - existingIds.size} more.`), { status: 400 });
        }

        const users = await prisma.user.findMany({ where: { id: { in: toAddIds } }, select: { id: true, name: true } });
        const validIds = new Set(users.map((u) => u.id));
        const invalid = toAddIds.filter((id) => !validIds.has(id));
        if (invalid.length) throw Object.assign(new Error(`Invalid user ids: ${invalid.join(',')}`), { status: 400 });

        await prisma.conversation.update({ where: { id: groupId }, data: { updatedAt: new Date() } });

        await prisma.conversationParticipant.createMany({
            data: toAddIds.map((id) => ({ conversationId: groupId, userId: id, role: 'member', joinedAt: new Date() })),
            skipDuplicates: true,
        });

        const names = users.map((u) => u.name || `User ${u.id}`).join(', ');
        const sysMsg = await prisma.message.create({
            data: {
                conversationId: groupId,
                senderId: adminId,
                type: 'text',
                content: `${names} joined the group`,
                isSystemMessage: true,
                systemMessageType: 'member_added',
                status: 'sent',
            },
        });

        const updated = await prisma.conversation.findUnique({
            where: { id: groupId },
            include: { participants: { include: { user: { select: { id: true, name: true, profileImage: true } } } } },
        });

        const minimalParts = ChatMapper.mapActiveParticipantsToMinimal(updated.participants);
        SocketEmitter.emitToUsers(updated.participants.map(p => p.userId), 'group-members-updated', { conversationId: groupId, participants: minimalParts });
        SocketEmitter.emitToUsers(updated.participants.map(p => p.userId), 'message-sent', { message: sysMsg });
        return { conversationId: groupId, participants: minimalParts };
    }

    static async removeGroupMembers({ adminId, groupId, members }) {
        const prisma = getPrismaInstance();
        if (!groupId || !Array.isArray(members) || members.length === 0) {
            throw Object.assign(new Error("groupId and members are required"), { status: 400 });
        }
        members = [...new Set(members.map((id) => Number(id)).filter((n) => !isNaN(n)))];

        const convo = await prisma.conversation.findUnique({
            where: { id: groupId },
            include: { participants: true },
        });
        if (!convo || convo.type !== 'group') throw Object.assign(new Error("Group not found"), { status: 404 });
        const adminPart = convo.participants.find((p) => p.userId === adminId);
        if (!adminPart || adminPart.role !== 'admin') throw Object.assign(new Error("Only admins can remove members"), { status: 403 });

        const targetIds = members.filter((id) => id !== adminId);
        const currentIds = new Set(convo.participants.map((p) => p.userId));
        const toRemove = targetIds.filter((id) => currentIds.has(id));
        if (toRemove.length === 0) return { participants: convo.participants };

        await prisma.conversationParticipant.updateMany({
            where: { conversationId: groupId, userId: { in: toRemove } },
            data: { leftAt: new Date() },
        });

        const removedUsers = await prisma.user.findMany({ where: { id: { in: toRemove } }, select: { id: true, name: true } });
        const names = removedUsers.map((u) => u.name || `User ${u.id}`).join(', ');
        const sysMsg = await prisma.message.create({
            data: {
                conversationId: groupId,
                senderId: adminId,
                type: 'text',
                content: `${names} left the group`,
                isSystemMessage: true,
                systemMessageType: 'member_removed',
                status: 'sent',
            },
        });

        const updated = await prisma.conversation.findUnique({
            where: { id: groupId },
            include: { participants: { include: { user: { select: { id: true, name: true, profileImage: true } } } } },
        });
        const minimalParts = ChatMapper.mapActiveParticipantsToMinimal(updated.participants);
        SocketEmitter.emitToUsers(updated.participants.filter(p => !p.leftAt).map(p => p.userId), 'group-members-updated', { conversationId: groupId, participants: minimalParts });

        // Notify both active members and the left members about the system message
        SocketEmitter.emitToUsers(updated.participants.map(p => p.userId), 'message-sent', { message: sysMsg });

        return { conversationId: groupId, participants: minimalParts };
    }

    static async updateGroupSettings({ adminId, groupId, groupName, groupDescription, groupIconUrl, file }) {
        const prisma = getPrismaInstance();
        if (!groupId) throw Object.assign(new Error('groupId is required'), { status: 400 });

        const convo = await prisma.conversation.findUnique({
            where: { id: groupId },
            include: { participants: true },
        });
        if (!convo || convo.type !== 'group') throw Object.assign(new Error('Group not found'), { status: 404 });

        const adminPart = convo.participants.find((p) => p.userId === adminId);
        if (!adminPart || adminPart.role !== 'admin') throw Object.assign(new Error('Only admins can update group settings'), { status: 403 });

        let iconUrl = undefined;
        let iconPublicId = undefined;
        if (file && file.buffer) {
            const cld = await uploadBuffer(file.buffer, {
                folder: process.env.CLOUDINARY_FOLDER || undefined,
                resource_type: "image",
            });
            iconUrl = cld.secure_url;
            iconPublicId = cld.public_id;
        } else if (typeof groupIconUrl === "string" && groupIconUrl.trim()) {
            iconUrl = groupIconUrl.trim();
        }

        try {
            const data = { updatedAt: new Date() };
            if (typeof groupName === 'string' && groupName.trim()) data.groupName = groupName.trim();
            if (typeof groupDescription === 'string') data.groupDescription = groupDescription.trim();
            if (iconUrl) data.groupIcon = iconUrl;

            const updatedConversation = await prisma.conversation.update({ where: { id: groupId }, data });
            const full = await prisma.conversation.findUnique({
                where: { id: groupId },
                include: { participants: { include: { user: { select: { id: true, name: true, profileImage: true } } } } },
            });

            const minimal = {
                id: full.id,
                groupName: full.groupName,
                groupDescription: full.groupDescription,
                groupIcon: full.groupIcon,
                createdById: full.createdById,
                updatedAt: full.updatedAt,
                participants: ChatMapper.mapParticipantsToMinimal(full.participants),
            };

            const sysMsg = await prisma.message.create({
                data: {
                    conversationId: groupId,
                    senderId: adminId,
                    type: 'text',
                    content: `Group settings updated`,
                    isSystemMessage: true,
                    systemMessageType: 'group_updated',
                    status: 'sent',
                },
            });

            SocketEmitter.emitToUsers(full.participants.map((p) => p.userId), 'group-updated', { conversation: minimal });
            SocketEmitter.emitToUsers(full.participants.map((p) => p.userId), 'message-sent', { message: sysMsg });
            return minimal;
        } catch (error) {
            if (iconPublicId) {
                try {
                    await deleteCloudinaryFile(iconPublicId, 'image');
                } catch (cleanupError) {
                    console.error("Failed to scrub orphaned group icon during update:", cleanupError);
                }
            }
            throw error;
        }
    }

    static async updateGroupRole({ adminId, groupId, userId, role }) {
        const prisma = getPrismaInstance();
        if (!groupId || !userId || (role !== 'admin' && role !== 'member')) {
            throw Object.assign(new Error('groupId, userId and valid role are required'), { status: 400 });
        }

        const convo = await prisma.conversation.findUnique({
            where: { id: groupId },
            include: { participants: true },
        });
        if (!convo || convo.type !== 'group') throw Object.assign(new Error('Group not found'), { status: 404 });

        const adminPart = convo.participants.find((p) => p.userId === adminId);
        if (!adminPart || adminPart.role !== 'admin') throw Object.assign(new Error('Only admins can update roles'), { status: 403 });

        const targetPart = convo.participants.find((p) => p.userId === Number(userId));
        if (!targetPart) throw Object.assign(new Error('Target user is not a participant'), { status: 400 });

        const adminCount = convo.participants.filter((p) => p.role === 'admin' && !p.leftAt).length;
        const demotingLastAdmin = targetPart.role === 'admin' && role === 'member' && adminCount === 1;
        if (demotingLastAdmin) throw Object.assign(new Error('Cannot demote the last admin'), { status: 400 });

        if (Number(userId) === adminId && demotingLastAdmin) {
            throw Object.assign(new Error('You are the last admin and cannot demote yourself'), { status: 400 });
        }

        await prisma.conversation.update({ where: { id: groupId }, data: { updatedAt: new Date() } });
        const updatedPart = await prisma.conversationParticipant.update({
            where: { id: targetPart.id },
            data: { role },
        });

        const updated = await prisma.conversation.findUnique({
            where: { id: groupId },
            include: { participants: { include: { user: { select: { id: true, name: true, profileImage: true } } } } },
        });

        SocketEmitter.emitToUsers(updated.participants.filter(p => !p.leftAt).map((p) => p.userId), 'group-role-updated', { conversationId: groupId, userId: Number(userId), role });
        return { conversationId: groupId, userId: Number(userId), role };
    }

    static async leaveGroup({ userId, groupId, permissions }) {
        const prisma = getPrismaInstance();
        if (!groupId) throw Object.assign(new Error("groupId is required"), { status: 400 });

        const convo = await prisma.conversation.findUnique({
            where: { id: groupId },
            include: { participants: true },
        });
        if (!convo || convo.type !== 'group') throw Object.assign(new Error("Group not found"), { status: 404 });

        const participant = convo.participants.find((p) => p.userId === userId && !p.leftAt);
        if (!participant) throw Object.assign(new Error("You are not an active member of this group"), { status: 400 });

        const activeParticipants = convo.participants.filter(p => !p.leftAt);
        const adminCount = activeParticipants.filter(p => p.role === 'admin').length;

        // If last admin but others remain, assign oldest member as admin
        if (participant.role === 'admin' && adminCount === 1 && activeParticipants.length > 1) {
            const otherMembers = activeParticipants.filter(p => p.userId !== userId);
            otherMembers.sort((a, b) => new Date(a.joinedAt || 0) - new Date(b.joinedAt || 0));
            const newAdmin = otherMembers[0];
            await prisma.conversationParticipant.update({
                where: { id: newAdmin.id },
                data: { role: 'admin' }
            });
            SocketEmitter.emitToUsers(activeParticipants.map(p => p.userId), 'group-role-updated', { conversationId: groupId, userId: newAdmin.userId, role: 'admin' });
        }

        await prisma.conversationParticipant.update({
            where: { id: participant.id },
            data: { leftAt: new Date() }
        });
        await prisma.conversation.update({ where: { id: groupId }, data: { updatedAt: new Date() } });

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        const name = user?.name || "A member";

        const sysMsg = await prisma.message.create({
            data: {
                conversationId: groupId,
                senderId: userId,
                type: 'text',
                content: `${name} left the group`,
                isSystemMessage: true,
                systemMessageType: 'member_removed',
                status: 'sent',
            },
        });

        const updated = await prisma.conversation.findUnique({
            where: { id: groupId },
            include: { participants: { include: { user: { select: { id: true, name: true, profileImage: true } } } } },
        });
        const minimalParts = ChatMapper.mapActiveParticipantsToMinimal(updated.participants);

        SocketEmitter.emitToUsers(updated.participants.filter(p => !p.leftAt).map(p => p.userId), 'group-members-updated', { conversationId: groupId, participants: minimalParts });
        SocketEmitter.emitToUsers(updated.participants.map(p => p.userId), 'message-sent', { message: sysMsg });

        return { message: "Left group successfully", conversationId: groupId };
    }

    static async deleteGroup({ adminId, groupId }) {
        const prisma = getPrismaInstance();
        if (!groupId) throw Object.assign(new Error("groupId is required"), { status: 400 });

        const convo = await prisma.conversation.findUnique({
            where: { id: groupId },
            include: { participants: true },
        });
        if (!convo || convo.type !== 'group') throw Object.assign(new Error("Group not found"), { status: 404 });

        const adminPart = convo.participants.find((p) => p.userId === adminId);
        if (!adminPart || adminPart.role !== 'admin') throw Object.assign(new Error("Only admins can delete the group"), { status: 403 });

        // Notify all participants before actual deletion
        SocketEmitter.emitToUsers(convo.participants.map(p => p.userId), 'group-deleted', { conversationId: groupId });
        await prisma.conversation.delete({ where: { id: groupId } });

        return { message: "Group deleted successfully", conversationId: groupId };
    }

    static async archiveChat({ userId, conversationId, archived, keepArchived }) {
        const prisma = getPrismaInstance();
        if (!conversationId || typeof archived !== "boolean") {
            throw Object.assign(new Error("Invalid payload"), { status: 400 });
        }

        const participant = await prisma.conversationParticipant.findFirst({
            where: { conversationId, userId },
        });
        if (!participant) throw Object.assign(new Error("Not a participant"), { status: 403 });

        const now = new Date();
        const updated = await prisma.conversationParticipant.update({
            where: { id: participant.id },
            data: {
                isArchived: archived,
                archivedAt: archived ? now : null,
                ...(typeof keepArchived === "boolean" ? { keepArchived } : {}),
            },
        });

        SocketEmitter.emitToUsers([userId], "chat-archived", { conversationId, archived, archivedAt: updated.archivedAt });

        return {
            conversationId,
            isArchived: updated.isArchived,
            archivedAt: updated.archivedAt,
        };
    }

    static async pinChat({ userId, conversationId, pinned }) {
        const prisma = getPrismaInstance();
        if (!conversationId || typeof pinned !== "boolean") {
            throw Object.assign(new Error("Invalid payload"), { status: 400 });
        }

        const participant = await prisma.conversationParticipant.findFirst({
            where: { conversationId, userId },
        });
        if (!participant) throw Object.assign(new Error("Not a participant"), { status: 403 });

        let data = {};
        const now = new Date();

        if (pinned) {
            const count = await prisma.conversationParticipant.count({
                where: { userId, isPinned: true },
            });
            if (count >= 3 && !participant.isPinned) {
                throw Object.assign(new Error("You can pin at most 3 chats"), { status: 400 });
            }
            const minOrderAgg = await prisma.conversationParticipant.aggregate({
                _min: { pinOrder: true },
                where: { userId, isPinned: true },
            });
            const currentMin = minOrderAgg?._min?.pinOrder;
            const nextOrder = (currentMin === null || currentMin === undefined) ? 0 : (currentMin - 1);
            data = { isPinned: true, pinnedAt: now, pinOrder: participant.isPinned ? participant.pinOrder : nextOrder };
        } else {
            data = { isPinned: false, pinnedAt: null, pinOrder: 0 };
        }

        const updated = await prisma.conversationParticipant.update({
            where: { id: participant.id },
            data,
        });

        SocketEmitter.emitToUsers([userId], "chat-pinned", { conversationId, pinned: updated.isPinned, pinOrder: updated.pinOrder });

        return {
            conversationId,
            isPinned: updated.isPinned,
            pinOrder: updated.pinOrder,
        };
    }

    static async muteChat({ userId, conversationId, muted, until }) {
        const prisma = getPrismaInstance();
        if (!conversationId || typeof muted !== "boolean") {
            throw Object.assign(new Error("Invalid payload"), { status: 400 });
        }

        let mutedUntil = null;
        if (muted) {
            if (until == null) {
                throw Object.assign(new Error("When muting, provide a future 'until' timestamp"), { status: 400 });
            }
            const ts = new Date(until);
            if (isNaN(ts.getTime()) || ts.getTime() <= Date.now()) {
                throw Object.assign(new Error("'until' must be a valid future timestamp"), { status: 400 });
            }
            mutedUntil = ts;
        }

        const participant = await prisma.conversationParticipant.findFirst({
            where: { conversationId, userId },
        });
        if (!participant) throw Object.assign(new Error("Not a participant"), { status: 403 });

        const updated = await prisma.conversationParticipant.update({
            where: { id: participant.id },
            data: {
                isMuted: muted,
                mutedUntil: muted ? mutedUntil : null,
            },
        });

        SocketEmitter.emitToUsers([userId], "chat-muted", { conversationId, muted: updated.isMuted, mutedUntil: updated.mutedUntil });

        return {
            conversationId,
            muted: updated.isMuted,
            mutedUntil: updated.mutedUntil,
        };
    }

    static async deleteChatForMe({ userId, conversationId }) {
        const prisma = getPrismaInstance();
        if (!conversationId) throw Object.assign(new Error("Invalid conversation id"), { status: 400 });

        const participant = await prisma.conversationParticipant.findFirst({
            where: { conversationId, userId },
        });
        if (!participant) throw Object.assign(new Error("Not a participant"), { status: 403 });
        if (participant.isDeleted) return true;

        const now = new Date();
        await prisma.conversationParticipant.update({
            where: { id: participant.id },
            data: { isDeleted: true, deletedAt: now },
        });

        SocketEmitter.emitToUsers([userId], "chat-deleted", { conversationId, deletedAt: now.toISOString() });

        return true;
    }

    static async clearChat({ userId, conversationId }) {
        const prisma = getPrismaInstance();
        if (!conversationId) throw Object.assign(new Error("Invalid conversation id"), { status: 400 });

        const participant = await prisma.conversationParticipant.findFirst({
            where: { conversationId, userId },
        });
        if (!participant) throw Object.assign(new Error("Not a participant"), { status: 403 });
        if (participant.isDeleted) throw Object.assign(new Error("Chat deleted for user"), { status: 400 });

        const now = new Date();
        await prisma.conversationParticipant.update({
            where: { id: participant.id },
            data: { clearedAt: now },
        });

        SocketEmitter.emitToUsers([userId], "chat-cleared", { conversationId, clearedAt: now.toISOString() });

        return true;
    }
}
