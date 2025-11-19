import getPrismaInstance from "../../utils/PrismaClient.js";
import { getOrCreateDirectConversation } from "./helpers.js";

export const getMessages = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { from, to } = req.params;

    const convo = await getOrCreateDirectConversation(prisma, from, to);
    // Fetch participant state for 'from' to get clearedAt
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: convo.id, userId: Number(from) },
      select: { clearedAt: true },
    });
    const clearedAt = participant?.clearedAt || null;
    const messages = await prisma.message.findMany({
      where: {
        conversationId: convo.id,
        ...(clearedAt ? { createdAt: { gt: clearedAt } } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    const unreadMessages = [];
    const otherUserId = Number(to);
    messages.forEach((message, index) => {
      if (message.senderId === otherUserId && message.status !== "read") {
        messages[index].status = "read";
        unreadMessages.push(message.id);
      }
    });

    if (unreadMessages.length) {
      await prisma.message.updateMany({
        where: { id: { in: unreadMessages } },
        data: { status: "read" },
      });
    }

    return res.status(200).json({ messages, unreadMessages });
  } catch (error) {
    next(error);
  }
};

export const getInitialContactswithMessages = async (req, res, next) => {
  try {
    const { from } = req.params;
    const userId = Number(from);
    const prisma = getPrismaInstance();

    const participants = await prisma.conversationParticipant.findMany({
      where: { userId, isDeleted: false },
      include: {
        conversation: {
          include: {
            participants: { include: { user: true } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    });

    const result = participants.map((p) => {
      const convo = p.conversation;
      const lastMsg = convo.messages[0] || null;
      const other = convo.type === 'direct' ? convo.participants.find(cp => cp.userId !== userId)?.user : null;
      return {
        conversationId: convo.id,
        type: convo.type,
        lastMessage: lastMsg ? {
          id: lastMsg.id,
          type: lastMsg.type,
          message: lastMsg.content,
          status: lastMsg.status,
          timestamp: lastMsg.createdAt,
          senderId: lastMsg.senderId,
        } : null,
        participantState: {
          isPinned: p.isPinned,
          isMuted: p.isMuted,
          isArchived: p.isArchived,
          unreadCount: p.unreadCount,
        },
        user: other ? {
          id: other.id,
          name: other.name,
          email: other.email,
          about: other.about,
          profileImage: other.profileImage,
        } : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: result,
      onlineUsers: Array.from((global.onlineUsers?.keys?.() || [])),
    });
  } catch (error) {
    next(error);
  }
};
