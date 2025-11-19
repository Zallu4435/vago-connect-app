import getPrismaInstance from "../../utils/PrismaClient.js";
import { uploadBuffer } from "../../utils/Cloudinary.js";

function emitToUsers(userIds, event, payload) {
  try {
    if (!global?.io || !global?.onlineUsers) return;
    userIds.forEach((uid) => {
      const sid = global.onlineUsers.get(String(uid)) || global.onlineUsers.get(uid);
      if (sid) global.io.to(sid).emit(event, payload);
    });
  } catch (_) {}
}

export const createGroup = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const creatorId = Number(req?.user?.userId);
    const { groupName, groupDescription, groupIconUrl } = req.body || {};

    let { memberIds } = req.body || {};

    if (!groupName || typeof groupName !== "string" || !groupName.trim()) {
      return res.status(400).json({ message: "groupName is required" });
    }

    // Normalize memberIds
    if (!Array.isArray(memberIds) || memberIds.length < 1) {
      return res.status(400).json({ message: "memberIds must contain at least one user" });
    }
    memberIds = [...new Set(memberIds.map((id) => Number(id)).filter((n) => !isNaN(n) && n !== creatorId))];
    if (memberIds.length < 1) {
      return res.status(400).json({ message: "memberIds cannot be empty or contain only the creator" });
    }

    // Validate users exist
    const users = await prisma.user.findMany({ where: { id: { in: memberIds } }, select: { id: true } });
    const validIds = new Set(users.map((u) => u.id));
    const invalid = memberIds.filter((id) => !validIds.has(id));
    if (invalid.length) {
      return res.status(400).json({ message: `Invalid memberIds: ${invalid.join(",")}` });
    }

    // Handle icon (either uploaded file or provided URL)
    let iconUrl = undefined;
    if (req.file && req.file.buffer) {
      const cld = await uploadBuffer(req.file.buffer, {
        folder: process.env.CLOUDINARY_FOLDER || undefined,
        resource_type: "image",
      });
      iconUrl = cld.secure_url;
    } else if (typeof groupIconUrl === "string" && groupIconUrl.trim()) {
      iconUrl = groupIconUrl.trim();
    }

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
      include: { participants: { include: { user: true } } },
    });

    emitToUsers(conversation.participants.map((p) => p.userId), "group-created", { conversation });
    return res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
};

export const addGroupMembers = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const adminId = Number(req?.user?.userId);
    const groupId = Number(req.params.groupId);
    let { members } = req.body || {};
    if (!groupId || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: "groupId and members are required" });
    }
    members = [...new Set(members.map((id) => Number(id)).filter((n) => !isNaN(n) && n !== adminId))];
    if (members.length === 0) return res.status(400).json({ message: "No valid members to add" });

    const convo = await prisma.conversation.findUnique({
      where: { id: groupId },
      include: { participants: true },
    });
    if (!convo || convo.type !== 'group') return res.status(404).json({ message: "Group not found" });
    const adminPart = convo.participants.find((p) => p.userId === adminId);
    if (!adminPart || adminPart.role !== 'admin') return res.status(403).json({ message: "Only admins can add members" });

    const existingIds = new Set(convo.participants.map((p) => p.userId));
    const toAddIds = members.filter((id) => !existingIds.has(id));
    if (toAddIds.length === 0) {
      return res.status(200).json({ participants: convo.participants });
    }

    const users = await prisma.user.findMany({ where: { id: { in: toAddIds } }, select: { id: true, name: true } });
    const validIds = new Set(users.map((u) => u.id));
    const invalid = toAddIds.filter((id) => !validIds.has(id));
    if (invalid.length) return res.status(400).json({ message: `Invalid user ids: ${invalid.join(',')}` });

    await prisma.conversation.update({ where: { id: groupId }, data: { updatedAt: new Date() } });

    await prisma.conversationParticipant.createMany({
      data: toAddIds.map((id) => ({ conversationId: groupId, userId: id, role: 'member', joinedAt: new Date() })),
      skipDuplicates: true,
    });

    const names = users.map((u) => u.name || `User ${u.id}`).join(', ');
    await prisma.message.create({
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
      include: { participants: { include: { user: true } } },
    });

    emitToUsers(updated.participants.map(p => p.userId), 'group-members-updated', { conversationId: groupId, participants: updated.participants });
    return res.status(200).json({ participants: updated.participants });
  } catch (error) {
    next(error);
  }
};

export const removeGroupMembers = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const adminId = Number(req?.user?.userId);
    const groupId = Number(req.params.groupId);
    let { members } = req.body || {};
    if (!groupId || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: "groupId and members are required" });
    }
    members = [...new Set(members.map((id) => Number(id)).filter((n) => !isNaN(n)))];

    const convo = await prisma.conversation.findUnique({
      where: { id: groupId },
      include: { participants: true },
    });
    if (!convo || convo.type !== 'group') return res.status(404).json({ message: "Group not found" });
    const adminPart = convo.participants.find((p) => p.userId === adminId);
    if (!adminPart || adminPart.role !== 'admin') return res.status(403).json({ message: "Only admins can remove members" });

    const targetIds = members.filter((id) => id !== adminId);
    const currentIds = new Set(convo.participants.map((p) => p.userId));
    const toRemove = targetIds.filter((id) => currentIds.has(id));
    if (toRemove.length === 0) return res.status(200).json({ participants: convo.participants });

    await prisma.conversationParticipant.updateMany({
      where: { conversationId: groupId, userId: { in: toRemove } },
      data: { leftAt: new Date() },
    });

    const removedUsers = await prisma.user.findMany({ where: { id: { in: toRemove } }, select: { id: true, name: true } });
    const names = removedUsers.map((u) => u.name || `User ${u.id}`).join(', ');
    await prisma.message.create({
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
      include: { participants: { include: { user: true } } },
    });
    emitToUsers(updated.participants.map(p => p.userId), 'group-members-updated', { conversationId: groupId, participants: updated.participants });
    return res.status(200).json({ participants: updated.participants });
  } catch (error) {
    next(error);
  }
};

export const updateGroupSettings = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const adminId = Number(req?.user?.userId);
    const groupId = Number(req.params.groupId);
    const { groupName, groupDescription, groupIconUrl } = req.body || {};

    if (!groupId) return res.status(400).json({ message: 'groupId is required' });

    const convo = await prisma.conversation.findUnique({
      where: { id: groupId },
      include: { participants: true },
    });
    if (!convo || convo.type !== 'group') return res.status(404).json({ message: 'Group not found' });

    const adminPart = convo.participants.find((p) => p.userId === adminId);
    if (!adminPart || adminPart.role !== 'admin') return res.status(403).json({ message: 'Only admins can update group settings' });

    const data = { updatedAt: new Date() };
    if (typeof groupName === 'string' && groupName.trim()) data.groupName = groupName.trim();
    if (typeof groupDescription === 'string') data.groupDescription = groupDescription.trim();
    if (typeof groupIconUrl === 'string' && groupIconUrl.trim()) data.groupIcon = groupIconUrl.trim();

    const updatedConversation = await prisma.conversation.update({ where: { id: groupId }, data });
    const full = await prisma.conversation.findUnique({
      where: { id: groupId },
      include: { participants: { include: { user: true } } },
    });

    emitToUsers(full.participants.map((p) => p.userId), 'group-updated', { conversation: full });
    return res.status(200).json(full);
  } catch (error) {
    next(error);
  }
};

export const updateGroupRole = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const adminId = Number(req?.user?.userId);
    const groupId = Number(req.params.groupId);
    const { userId, role, permissions } = req.body || {};

    if (!groupId || !userId || (role !== 'admin' && role !== 'member')) {
      return res.status(400).json({ message: 'groupId, userId and valid role are required' });
    }

    const convo = await prisma.conversation.findUnique({
      where: { id: groupId },
      include: { participants: true },
    });
    if (!convo || convo.type !== 'group') return res.status(404).json({ message: 'Group not found' });

    const adminPart = convo.participants.find((p) => p.userId === adminId);
    if (!adminPart || adminPart.role !== 'admin') return res.status(403).json({ message: 'Only admins can update roles' });

    const targetPart = convo.participants.find((p) => p.userId === Number(userId));
    if (!targetPart) return res.status(400).json({ message: 'Target user is not a participant' });

    const adminCount = convo.participants.filter((p) => p.role === 'admin' && !p.leftAt).length;
    const demotingLastAdmin = targetPart.role === 'admin' && role === 'member' && adminCount === 1;
    if (demotingLastAdmin) return res.status(400).json({ message: 'Cannot demote the last admin' });

    if (Number(userId) === adminId && demotingLastAdmin) {
      return res.status(400).json({ message: 'You are the last admin and cannot demote yourself' });
    }

    await prisma.conversation.update({ where: { id: groupId }, data: { updatedAt: new Date() } });
    const updatedPart = await prisma.conversationParticipant.update({
      where: { id: targetPart.id },
      data: { role },
    });

    const updated = await prisma.conversation.findUnique({
      where: { id: groupId },
      include: { participants: { include: { user: true } } },
    });

    emitToUsers(updated.participants.map((p) => p.userId), 'group-role-updated', { conversationId: groupId, userId: Number(userId), role });
    return res.status(200).json({ participant: updatedPart });
  } catch (error) {
    next(error);
  }
};
