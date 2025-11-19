import getPrismaInstance from "../../utils/PrismaClient.js";

export const editMessage = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const id = Number(req.params.id);
    const { content } = req.body || {};
    if (!id || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    const message = await prisma.message.findUnique({
      where: { id },
      include: { conversation: { include: { participants: true } } },
    });
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const requesterId = Number(req?.user?.userId);
    if (message.senderId !== requesterId) {
      return res.status(403).json({ message: 'Only sender can edit this message' });
    }
    if (message.isDeletedForEveryone) {
      return res.status(400).json({ message: 'Message was deleted' });
    }
    const createdAt = new Date(message.createdAt).getTime();
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    if (now - createdAt > fifteenMinutes) {
      return res.status(400).json({ message: 'Edit window expired' });
    }

    const history = Array.isArray(message.editHistory) ? message.editHistory : [];
    history.push({ previousContent: message.content, editedAt: new Date().toISOString() });

    const updated = await prisma.message.update({
      where: { id },
      data: {
        content,
        isEdited: true,
        editedAt: new Date(),
        originalContent: message.originalContent ?? message.content,
        editHistory: history,
      },
    });

    try {
      const participantUserIds = message.conversation.participants.map(p => p.userId);
      if (global?.io && global?.onlineUsers) {
        participantUserIds.forEach((uid) => {
          const sid = global.onlineUsers.get(String(uid)) || global.onlineUsers.get(uid);
          if (sid) global.io.to(sid).emit('message-edited', { messageId: updated.id, newContent: updated.content, editedAt: updated.editedAt });
        });
      }
    } catch (_) {}

    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};
