import getPrismaInstance from "../../utils/PrismaClient.js";

export const starMessage = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const id = Number(req.params.id);
    const { starred } = req.body || {};
    if (!id || typeof starred !== 'boolean') {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const requesterId = Number(req?.user?.userId);
    const message = await prisma.message.findUnique({
      where: { id },
      include: { conversation: { include: { participants: true } } },
    });
    if (!message) return res.status(404).json({ message: "Message not found" });

    const isParticipant = message.conversation.participants.some(p => p.userId === requesterId);
    if (!isParticipant) return res.status(403).json({ message: "Not a participant" });

    const arr = Array.isArray(message.starredBy) ? message.starredBy : [];
    let nextArr = arr;

    if (starred) {
      const exists = arr.some((e) => (e?.userId ?? e) === requesterId);
      if (!exists) {
        nextArr = [...arr, { userId: requesterId, starredAt: new Date().toISOString() }];
      }
    } else {
      nextArr = arr.filter((e) => (e?.userId ?? e) !== requesterId);
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { starredBy: nextArr },
    });

    try {
      if (global?.io && global?.onlineUsers) {
        const sid = global.onlineUsers.get(String(requesterId)) || global.onlineUsers.get(requesterId);
        if (sid) global.io.to(sid).emit("message-starred", { messageId: updated.id, starred });
      }
    } catch (_) {}

    return res.status(200).json({ id: updated.id, starred });
  } catch (error) {
    next(error);
  }
};
