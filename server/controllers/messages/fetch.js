import getPrismaInstance from "../../utils/PrismaClient.js";
import { getOrCreateDirectConversation } from "./helpers.js";

export const getMessages = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { from, to } = req.params;
    const isGroup = req.query.isGroup === 'true';

    let convo;
    if (isGroup) {
      convo = await prisma.conversation.findUnique({ where: { id: Number(to) } });
      if (!convo || convo.type !== 'group') {
        return res.status(404).json({ message: "Group not found" });
      }
    } else {
      convo = await getOrCreateDirectConversation(prisma, from, to);
    }

    // Query params
    const rawLimit = Number(req.query.limit);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;
    const cursorId = req.query.cursor ? Number(req.query.cursor) : undefined;
    const direction = req.query.direction === 'after' ? 'asc' : 'desc'; // default fetch older messages
    const markRead = String(req.query.markRead || '').toLowerCase() === 'true';

    // Participant clearedAt support
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: convo.id, userId: Number(from) },
      select: { clearedAt: true },
    });
    const clearedAt = participant?.clearedAt || null;

    // Fetch with pagination
    const rows = await prisma.message.findMany({
      where: {
        conversationId: convo.id,
        ...(clearedAt ? { createdAt: { gt: clearedAt } } : {}),
        NOT: {
          deletedBy: {
            array_contains: Number(from),
          },
        },
      },
      orderBy: { createdAt: direction },
      take: limit + 1,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true
              }
            }
          }
        }
      }
    });

    let nextCursor = null;
    let page = rows;
    if (rows.length > limit) {
      const next = rows.pop();
      nextCursor = next?.id ? String(next.id) : null;
      page = rows;
    }

    // If we fetched desc for older pagination, but client prefers asc, reverse back
    const messages = direction === 'desc' ? page.slice().reverse() : page;

    // Optional mark read side-effect
    let unreadMessages = [];
    if (markRead) {
      const otherUserId = Number(to);
      const pending = messages.filter((m) => m.senderId === otherUserId && m.status !== 'read').map((m) => m.id);
      if (pending.length) {
        await prisma.message.updateMany({ where: { id: { in: pending } }, data: { status: 'read' } });
        unreadMessages = pending;
      }
    }

    return res.status(200).json({ messages, nextCursor, ...(markRead ? { unreadMessages } : {}) });
  } catch (error) {
    next(error);
  }
};

export const getInitialContactswithMessages = async (req, res, next) => {
  try {
    const { from } = req.params;
    const userId = Number(from);
    const prisma = getPrismaInstance();

    // Pagination: limit, cursor (participant id). Order by participant id desc for stability.
    const rawLimit = Number(req.query.limit);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;
    const cursorId = req.query.cursor ? Number(req.query.cursor) : undefined;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const participants = await prisma.conversationParticipant.findMany({
      where: { userId, isDeleted: false },
      orderBy: { id: 'desc' },
      take: limit + 1,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      include: {
        conversation: {
          include: {
            participants: { include: { user: { select: { id: true, name: true, email: true, about: true, profileImage: true } } } },
            messages: {
              where: {
                NOT: {
                  deletedBy: {
                    array_contains: userId,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
              include: {
                reactions: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        profileImage: true
                      }
                    }
                  }
                }
              }
            },
          },
        },
      },
    });

    let nextCursor = null;
    let page = participants;
    if (participants.length > limit) {
      const next = participants.pop();
      nextCursor = next?.id ? String(next.id) : null;
      page = participants;
    }

    let result = page.map((p) => {
      const convo = p.conversation;
      const clearedAt = p.clearedAt ? new Date(p.clearedAt).getTime() : 0;
      const validMessages = convo.messages.filter(m => new Date(m.createdAt).getTime() > clearedAt);
      const lastMsg = validMessages[0] || null;
      const other = convo.type === 'direct' ? (convo.participants.find(cp => cp.userId !== userId)?.user || convo.participants.find(cp => cp.userId === userId)?.user) : null;
      return {
        conversationId: convo.id,
        type: convo.type,
        participants: convo.participants.map(p => ({
          userId: p.userId,
          role: p.role,
          user: p.user ? {
            id: p.user.id,
            name: p.user.name,
            email: p.user.email,
            profileImage: p.user.profileImage
          } : null
        })),
        groupName: convo.groupName,
        groupDescription: convo.groupDescription,
        groupIcon: convo.groupIcon,
        lastMessage: lastMsg ? {
          id: lastMsg.id,
          type: lastMsg.type,
          message: lastMsg.type === 'text' ? lastMsg.content : '',
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

    if (q) {
      const term = q.toLowerCase();
      result = result.filter((row) => {
        if (row.type === 'group') {
          const name = String(row.groupName || '').toLowerCase();
          return name.includes(term);
        }
        const u = row?.user;
        if (!u) return false;
        const name = String(u.name || '').toLowerCase();
        const email = String(u.email || '').toLowerCase();
        const about = String(u.about || '').toLowerCase();
        return name.includes(term) || email.includes(term) || about.includes(term);
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
      onlineUsers: Array.from((global.onlineUsers?.keys?.() || [])),
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
};
