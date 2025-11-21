import getPrismaInstance from "../../utils/PrismaClient.js";

export const deleteMessage = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const id = Number(req.params.id);
    const deleteType = (req.query.deleteType || "").toString();
    if (!id || (deleteType !== "forMe" && deleteType !== "forEveryone")) {
      return res.status(400).json({ message: "Invalid deleteType or id" });
    }

    const message = await prisma.message.findUnique({
      where: { id },
      include: { conversation: { include: { participants: true } } },
    });
    if (!message) return res.status(404).json({ message: "Message not found" });

    const requesterId = Number(req?.user?.userId);
    const isParticipant = message.conversation.participants.some(p => p.userId === requesterId);
    if (!isParticipant) return res.status(403).json({ message: "Not a participant" });

    if (deleteType === "forEveryone") {
      if (message.senderId !== requesterId) {
        return res.status(403).json({ message: "Only sender can delete for everyone" });
      }
      if (message.isDeletedForEveryone) {
        // idempotent: already deleted for everyone
        return res.status(200).json({ id: message.id, deleteType: "forEveryone" });
      }
      const createdAt = new Date(message.createdAt).getTime();
      const fortyEightHours = 48 * 60 * 60 * 1000;
      if (Date.now() - createdAt > fortyEightHours) {
        return res.status(400).json({ message: "Delete for everyone window expired" });
      }

      const updated = await prisma.message.update({
        where: { id },
        data: {
          isDeletedForEveryone: true,
          deletedForEveryoneAt: new Date(),
          content: "This message was deleted",
        },
      });

      // notify all participants
      try {
        const userIds = message.conversation.participants.map(p => p.userId);
        if (global?.io && global?.onlineUsers) {
          userIds.forEach((uid) => {
            const sid = global.onlineUsers.get(String(uid)) || global.onlineUsers.get(uid);
            if (sid) global.io.to(sid).emit("message-deleted", { messageId: updated.id, deleteType: "forEveryone" });
          });
        }
      } catch (_) {}

      return res.status(200).json({ id: updated.id, deleteType: "forEveryone" });
    }

    // deleteType === "forMe"
    const deletedBy = Array.isArray(message.deletedBy) ? message.deletedBy : [];
    if (!deletedBy.includes(requesterId)) {
      deletedBy.push(requesterId);
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { deletedBy },
    });

    try {
      const sid = global?.onlineUsers?.get?.(String(requesterId)) || global?.onlineUsers?.get?.(requesterId);
      if (global?.io && sid) {
        global.io.to(sid).emit("message-deleted", { messageId: updated.id, deleteType: "forMe", deletedBy });
      }
    } catch (_) {}

    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};
