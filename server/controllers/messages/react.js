import getPrismaInstance from "../../utils/PrismaClient.js";

export const reactToMessage = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const id = Number(req.params.id);
    const { emoji } = req.body || {};
    if (!id || typeof emoji !== 'string' || !emoji.trim()) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const requesterId = Number(req?.user?.userId);
    const message = await prisma.message.findUnique({
      where: { id },
      include: { conversation: { include: { participants: true } }, reactions: true },
    });
    if (!message) return res.status(404).json({ message: "Message not found" });

    const isParticipant = message.conversation.participants.some(p => p.userId === requesterId);
    if (!isParticipant) return res.status(403).json({ message: "Not a participant" });

    // Check existing reaction by this user
    const existing = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId: { messageId: id, userId: requesterId },
      },
    });

    let action = "created";
    if (!existing) {
      await prisma.messageReaction.create({
        data: {
          messageId: id,
          userId: requesterId,
          emoji,
        },
      });
    } else if (existing.emoji === emoji) {
      await prisma.messageReaction.delete({
        where: { messageId_userId: { messageId: id, userId: requesterId } },
      });
      action = "removed";
    } else {
      await prisma.messageReaction.update({
        where: { messageId_userId: { messageId: id, userId: requesterId } },
        data: { emoji },
      });
      action = "updated";
    }

    // Return updated reactions for the message
    const reactions = await prisma.messageReaction.findMany({
      where: { messageId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        }
      }
    });

    // Emit to all participants
    try {
      if (global?.io && global?.onlineUsers) {
        message.conversation.participants.forEach((p) => {
          const sid = global.onlineUsers.get(String(p.userId)) || global.onlineUsers.get(p.userId);
          if (sid) global.io.to(sid).emit("message-reacted", { messageId: id, emoji, userId: requesterId, action, reactions });
        });
      }
    } catch (_) { }

    return res.status(200).json({ id, reactions });
  } catch (error) {
    next(error);
  }
};
