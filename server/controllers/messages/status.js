import getPrismaInstance from "../../utils/PrismaClient.js";

export const updateMessageStatus = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { messageId, status } = req.body || {};
    const allowed = ["sent", "delivered", "read"];
    const idNum = parseInt(messageId);
    if (!idNum || !allowed.includes(status)) {
      return res.status(400).json({ status: false, message: "Invalid payload" });
    }
    const updated = await prisma.message.update({
      where: { id: idNum },
      data: { status },
      include: { conversation: { include: { participants: true } } },
    });

    try {
      const senderSocket = global?.onlineUsers?.get?.(String(updated.senderId)) || global?.onlineUsers?.get?.(updated.senderId);
      const otherParticipant = updated.conversation.participants.find(p => p.userId !== updated.senderId);
      const receiverSocket = otherParticipant ? (global?.onlineUsers?.get?.(String(otherParticipant.userId)) || global?.onlineUsers?.get?.(otherParticipant.userId)) : null;
      if (global?.io) {
        if (senderSocket) global.io.to(senderSocket).emit("message-status-update", { messageId: updated.id, status });
        if (receiverSocket) global.io.to(receiverSocket).emit("message-status-update", { messageId: updated.id, status });
      }
    } catch (_) { }

    return res.status(200).json({ id: updated.id, status });
  } catch (error) {
    next(error);
  }
};
