import getPrismaInstance from "../../utils/PrismaClient.js";

export const pinChat = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const conversationId = Number(req.params.id);
    const userId = Number(req?.user?.userId);
    const { pinned } = req.body || {};

    if (!conversationId || typeof pinned !== "boolean") {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!participant) return res.status(403).json({ message: "Not a participant" });

    let data = {};
    const now = new Date();

    if (pinned) {
      // Enforce max 3 pins per user
      const count = await prisma.conversationParticipant.count({
        where: { userId, isPinned: true },
      });
      if (count >= 3 && !participant.isPinned) {
        return res.status(400).json({ message: "You can pin at most 3 chats" });
      }
      // Determine pinOrder to appear at top (lowest first). Use current minimum - 1.
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

    try {
      if (global?.io && global?.onlineUsers) {
        const sid = global.onlineUsers.get(String(userId)) || global.onlineUsers.get(userId);
        if (sid) global.io.to(sid).emit("chat-pinned", { conversationId, pinned: updated.isPinned, pinOrder: updated.pinOrder });
      }
    } catch (_) {}

    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};
