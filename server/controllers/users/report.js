import getPrismaInstance from "../../utils/PrismaClient.js";

const ALLOWED_REASONS = new Set(["spam", "inappropriate", "harassment", "other"]);

export const reportUser = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const reporterId = Number(req?.user?.userId);
    const reportedId = Number(req.params.userId);
    const { reason, description, conversationId, softDelete } = req.body || {};

    if (!reportedId || typeof reason !== "string" || !ALLOWED_REASONS.has(reason)) {
      return res.status(400).json({ message: "Invalid payload" });
    }
    if (reporterId === reportedId) {
      return res.status(400).json({ message: "Cannot report yourself" });
    }

    // Optional: ensure reporter participates in conversation if provided
    let convo = null;
    if (conversationId != null) {
      const cid = Number(conversationId);
      convo = await prisma.conversation.findFirst({
        where: {
          id: cid,
          participants: { some: { userId: reporterId } },
        },
        include: { participants: true },
      });
      if (!convo) return res.status(403).json({ message: "Not a participant in conversation" });
    }

    // Prevent duplicate report per reporter-reported-conversation (null conversation allowed)
    const existing = await prisma.reportedUser.findFirst({
      where: {
        reporterId,
        reportedId,
        ...(convo ? { conversationId: convo.id } : { conversationId: null }),
      },
    });
    if (existing) return res.status(200).json({ id: existing.id, status: existing.status });

    const created = await prisma.reportedUser.create({
      data: {
        reporterId,
        reportedId,
        conversationId: convo ? convo.id : null,
        reason,
        description: description || null,
      },
      select: { id: true, status: true },
    });

    // Optional: soft-delete prior messages from reported user for the reporter in that conversation
    if (softDelete && convo) {
      try {
        const msgs = await prisma.message.findMany({
          where: { conversationId: convo.id, senderId: reportedId },
          select: { id: true, deletedBy: true },
        });
        const updates = [];
        msgs.forEach((m) => {
          const arr = Array.isArray(m.deletedBy) ? m.deletedBy : [];
          if (!arr.includes(reporterId)) arr.push(reporterId);
          updates.push(prisma.message.update({ where: { id: m.id }, data: { deletedBy: arr } }));
        });
        if (updates.length) await prisma.$transaction(updates);
      } catch (_) {}
    }

    return res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

export const listReports = async (_req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const reports = await prisma.reportedUser.findMany({
      orderBy: { reportedAt: "desc" },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        reported: { select: { id: true, name: true, email: true } },
      },
    });
    return res.status(200).json({ reports });
  } catch (error) {
    next(error);
  }
};
