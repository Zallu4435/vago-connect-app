import getPrismaInstance from "../../utils/PrismaClient.js";

export const muteChat = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const conversationId = Number(req.params.id);
    const userId = Number(req?.user?.userId);
    const { muted, until } = req.body || {};

    if (!conversationId || typeof muted !== "boolean") {
      return res.status(400).json({ message: "Invalid payload" });
    }

    // Validate 'until'
    let mutedUntil = null;
    if (muted) {
      if (until == null) {
        return res.status(400).json({ message: "When muting, provide a future 'until' timestamp" });
      }
      const ts = new Date(until);
      if (isNaN(ts.getTime()) || ts.getTime() <= Date.now()) {
        return res.status(400).json({ message: "'until' must be a valid future timestamp" });
      }
      mutedUntil = ts;
    }

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!participant) return res.status(403).json({ message: "Not a participant" });

    const updated = await prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: {
        isMuted: muted,
        mutedUntil: muted ? mutedUntil : null,
      },
    });

    try {
      if (global?.io && global?.onlineUsers) {
        const sid = global.onlineUsers.get(String(userId)) || global.onlineUsers.get(userId);
        if (sid) global.io.to(sid).emit("chat-muted", { conversationId, muted: updated.isMuted, mutedUntil: updated.mutedUntil });
      }
    } catch (_) {}

    return res.status(200).json({
      conversationId,
      muted: updated.isMuted,
      mutedUntil: updated.mutedUntil,
    });
  } catch (error) {
    next(error);
  }
};
