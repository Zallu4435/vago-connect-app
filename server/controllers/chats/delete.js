import getPrismaInstance from "../../utils/PrismaClient.js";

export const deleteChatForMe = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const conversationId = Number(req.params.id);
    const userId = Number(req?.user?.userId);
    if (!conversationId) return res.status(400).json({ message: "Invalid conversation id" });

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!participant) return res.status(403).json({ message: "Not a participant" });
    if (participant.isDeleted) return res.status(204).send(); // idempotent

    const now = new Date();
    await prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { isDeleted: true, deletedAt: now },
    });

    try {
      if (global?.io && global?.onlineUsers) {
        const sid = global.onlineUsers.get(String(userId)) || global.onlineUsers.get(userId);
        if (sid) global.io.to(sid).emit("chat-deleted", { conversationId, deletedAt: now.toISOString() });
      }
    } catch (_) {}

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};
