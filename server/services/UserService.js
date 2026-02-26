import getPrismaInstance from "../utils/PrismaClient.js";
import { SocketEmitter } from "../utils/SocketEmitter.js";

export class UserService {
    static async checkUser({ email }) {
        if (!email) {
            return { message: "Email is required", status: false, statusCode: 400 };
        }

        const prisma = getPrismaInstance();
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, name: true, email: true, about: true, profileImage: true },
        });

        if (!user) {
            return { message: "User not found", status: false, statusCode: 200 };
        }

        return { message: "User found", status: true, user, statusCode: 200 };
    }

    static async onBoardUser({ name, email, about, image, profileImage }) {
        const finalProfileImage = typeof profileImage === 'string' ? profileImage : (typeof image === 'string' ? image : null);
        if (!name || !email) {
            return { message: "Name and email are required", status: false, statusCode: 400 };
        }

        const prisma = getPrismaInstance();
        const created = await prisma.user.create({
            data: { name, email, about: about || undefined, profileImage: finalProfileImage || undefined }
        });

        const user = {
            id: created.id,
            name: created.name,
            email: created.email,
            about: created.about,
            profileImage: created.profileImage,
        };

        return { message: "User created", status: true, user, statusCode: 201 };
    }

    static async updateProfile({ userId, name, about, profileImage }) {
        if (!userId) {
            return { message: "User ID is required", status: false, statusCode: 400 };
        }

        const prisma = getPrismaInstance();

        // Partial update - only update fields that are provided and valid
        const dataToUpdate = {};
        if (typeof name === 'string' && name.trim()) dataToUpdate.name = name.trim();
        if (typeof about === 'string' && about.trim()) dataToUpdate.about = about.trim();
        if (profileImage !== undefined) dataToUpdate.profileImage = profileImage;

        const updated = await prisma.user.update({
            where: { id: Number(userId) },
            data: dataToUpdate,
            select: { id: true, name: true, email: true, about: true, profileImage: true },
        });

        if (global?.io && global?.onlineUsers) {
            SocketEmitter.emitToUsers(Array.from(global.onlineUsers.keys()), 'profile-updated', {
                user: updated
            });
        }

        return { message: "Profile updated", status: true, user: updated, statusCode: 200 };
    }

    static async getAllUser({ q, rawLimit, cursorId, sort, userId }) {
        const prisma = getPrismaInstance();

        const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;

        const where = q
            ? {
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                ],
            }
            : undefined;

        const rows = await prisma.user.findMany({
            where,
            orderBy: { name: sort },
            take: limit + 1,
            ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
            select: {
                id: true,
                name: true,
                email: true,
                about: true,
                profileImage: true,
            },
        });

        let nextCursor = null;
        let list = rows;
        if (rows.length > limit) {
            const next = rows.pop();
            nextCursor = next?.id ? String(next.id) : null;
            list = rows;
        }

        let blockedSet = new Set();
        if (userId) {
            const blockedRecords = await prisma.blockedUser.findMany({
                where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
                select: { blockerId: true, blockedId: true }
            });
            blockedRecords.forEach(r => {
                if (r.blockerId === userId) blockedSet.add(r.blockedId);
                if (r.blockedId === userId) blockedSet.add(r.blockerId);
            });
        }

        const usersGroupByInitialLetters = list.reduce((acc, user) => {
            const initial = (user?.name || '').charAt(0).toUpperCase() || '#';
            if (!acc[initial]) acc[initial] = [];
            user.isBlocked = blockedSet.has(user.id);
            acc[initial].push(user);
            return acc;
        }, {});

        return {
            message: 'Users found',
            status: true,
            users: usersGroupByInitialLetters,
            nextCursor,
            statusCode: 200,
        };
    }

    static async blockUser({ blockerId, blockedId }) {
        const prisma = getPrismaInstance();
        if (!blockedId) throw Object.assign(new Error("Invalid user id"), { status: 400 });
        if (blockerId === blockedId) throw Object.assign(new Error("Cannot block yourself"), { status: 400 });

        const existing = await prisma.blockedUser.findUnique({
            where: { blockerId_blockedId: { blockerId, blockedId } },
        });
        if (existing) return existing;

        const created = await prisma.blockedUser.create({
            data: { blockerId, blockedId },
        });

        SocketEmitter.emitToUser(blockerId, "contact-blocked", { userId: blockedId });
        SocketEmitter.emitToUser(blockedId, "contact-blocked-by", { userId: blockerId });

        return created;
    }

    static async unblockUser({ blockerId, blockedId }) {
        const prisma = getPrismaInstance();
        if (!blockedId) throw Object.assign(new Error("Invalid user id"), { status: 400 });

        const existing = await prisma.blockedUser.findUnique({
            where: { blockerId_blockedId: { blockerId, blockedId } },
        });
        if (!existing) return { success: true };

        await prisma.blockedUser.delete({
            where: { blockerId_blockedId: { blockerId, blockedId } },
        });

        SocketEmitter.emitToUser(blockerId, "contact-unblocked", { userId: blockedId });
        SocketEmitter.emitToUser(blockedId, "contact-unblocked-by", { userId: blockerId });

        return { success: true };
    }

    static async reportUser({ reporterId, reportedId, reason, description, conversationId, softDelete }) {
        const ALLOWED_REASONS = new Set(["spam", "inappropriate", "harassment", "other"]);
        const prisma = getPrismaInstance();

        if (!reportedId || typeof reason !== "string" || !ALLOWED_REASONS.has(reason)) {
            throw Object.assign(new Error("Invalid payload"), { status: 400 });
        }
        if (reporterId === reportedId) {
            throw Object.assign(new Error("Cannot report yourself"), { status: 400 });
        }

        let convo = null;
        if (conversationId != null) {
            const cid = Number(conversationId);
            convo = await prisma.conversation.findFirst({
                where: {
                    id: cid,
                    participants: { some: { userId: reporterId } },
                },
                include: { participants: true },
            });
            if (!convo) throw Object.assign(new Error("Not a participant in conversation"), { status: 403 });
        }

        const existing = await prisma.reportedUser.findFirst({
            where: {
                reporterId,
                reportedId,
                ...(convo ? { conversationId: convo.id } : { conversationId: null }),
            },
        });
        if (existing) return { id: existing.id, status: existing.status };

        const created = await prisma.reportedUser.create({
            data: {
                reporterId,
                reportedId,
                conversationId: convo ? convo.id : null,
                reason,
                description: description || null,
            },
            select: { id: true, status: true },
        });

        if (softDelete && convo) {
            try {
                const msgs = await prisma.message.findMany({
                    where: { conversationId: convo.id, senderId: reportedId },
                    select: { id: true, deletedBy: true },
                });
                const updates = [];
                msgs.forEach((m) => {
                    const arr = Array.isArray(m.deletedBy) ? m.deletedBy : [];
                    if (!arr.includes(reporterId)) arr.push(reporterId);
                    updates.push(prisma.message.update({ where: { id: m.id }, data: { deletedBy: arr } }));
                });
                if (updates.length) await prisma.$transaction(updates);
            } catch (_) { }
        }

        return created;
    }

    static async listReports() {
        const prisma = getPrismaInstance();
        const reports = await prisma.reportedUser.findMany({
            orderBy: { reportedAt: "desc" },
            include: {
                reporter: { select: { id: true, name: true, email: true } },
                reported: { select: { id: true, name: true, email: true } },
            },
        });
        return { reports };
    }
}
