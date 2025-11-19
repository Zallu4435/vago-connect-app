import getPrismaInstance from "../../utils/PrismaClient.js";

export const blockUser = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const blockerId = Number(req?.user?.userId);
    const blockedId = Number(req.params.userId);
    if (!blockedId) return res.status(400).json({ message: "Invalid user id" });
    if (blockerId === blockedId) return res.status(400).json({ message: "Cannot block yourself" });

    const existing = await prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    if (existing) return res.status(200).json(existing);

    const created = await prisma.blockedUser.create({
      data: { blockerId, blockedId },
    });

    try {
      if (global?.io && global?.onlineUsers) {
        const sid = global.onlineUsers.get(String(blockerId)) || global.onlineUsers.get(blockerId);
        if (sid) global.io.to(sid).emit("contact-blocked", { userId: blockedId });
      }
    } catch (_) {}

    return res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const blockerId = Number(req?.user?.userId);
    const blockedId = Number(req.params.userId);
    if (!blockedId) return res.status(400).json({ message: "Invalid user id" });

    const existing = await prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    if (!existing) return res.status(200).json({ success: true });

    await prisma.blockedUser.delete({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });

    try {
      if (global?.io && global?.onlineUsers) {
        const sid = global.onlineUsers.get(String(blockerId)) || global.onlineUsers.get(blockerId);
        if (sid) global.io.to(sid).emit("contact-unblocked", { userId: blockedId });
      }
    } catch (_) {}

    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
