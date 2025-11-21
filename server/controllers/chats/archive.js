import getPrismaInstance from "../../utils/PrismaClient.js";

export const archiveChat = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const conversationId = Number(req.params.id);
    const userId = Number(req?.user?.userId);
    const { archived, keepArchived } = req.body || {};

    if (!conversationId || typeof archived !== "boolean") {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!participant) return res.status(403).json({ message: "Not a participant" });

    const now = new Date();
    const updated = await prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: {
        isArchived: archived,
        archivedAt: archived ? now : null,
        ...(typeof keepArchived === "boolean" ? { keepArchived } : {}),
      },
    });

    try {
      if (global?.io && global?.onlineUsers) {
        const sid = global.onlineUsers.get(String(userId)) || global.onlineUsers.get(userId);
        if (sid) global.io.to(sid).emit("chat-archived", { conversationId, archived, archivedAt: updated.archivedAt });
      }
    } catch (_) {}

    return res.status(200).json({
      conversationId,
      isArchived: updated.isArchived,
      archivedAt: updated.archivedAt,
    });
  } catch (error) {
    next(error);
  }
};
