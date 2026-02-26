import { MessageService } from "../../services/MessageService.js";
import getPrismaInstance from "../../utils/PrismaClient.js";
import { MessageMapper } from "../../utils/mappers/MessageMapper.js";

export const getMessages = async (req, res, next) => {
  try {
    const { to } = req.params;
    const from = req.user.userId;
    const isGroup = req.query.isGroup === 'true';

    // Query params
    const rawLimit = Number(req.query.limit);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;
    const cursorId = req.query.cursor ? Number(req.query.cursor) : undefined;
    const direction = req.query.direction === 'after' ? 'asc' : 'desc'; // default fetch older messages
    const markRead = String(req.query.markRead || '').toLowerCase() === 'true';

    const result = await MessageService.getMessages({
      from: Number(from),
      to: Number(to),
      isGroup,
      limit,
      cursorId,
      direction,
      markRead
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};

export const getInitialContactswithMessages = async (req, res, next) => {
  try {
    const userId = Number(req.user.userId);
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

    const blockedRecords = await prisma.blockedUser.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }]
      },
      select: { blockerId: true, blockedId: true }
    });

    const blockedThem = new Set();
    const blockedByThem = new Set();

    blockedRecords.forEach(r => {
      // I blocked them
      if (r.blockerId === userId) blockedThem.add(r.blockedId);
      // They blocked me
      if (r.blockedId === userId) blockedByThem.add(r.blockerId);
    });

    let result = page.map((p) => {
      const mapped = MessageMapper.toConversationListItem(p, userId);
      if (mapped.type === 'direct' && mapped.user) {
        mapped.user.isBlocked = blockedThem.has(mapped.user.id);
        mapped.user.blockedBy = blockedByThem.has(mapped.user.id);
      }
      return mapped;
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

export const getCallHistory = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId || '');
    if (!userId) {
      return res.status(400).json({ message: "User ID is required", status: false });
    }

    const prisma = getPrismaInstance();

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const dateQuery = typeof req.query.date === 'string' ? req.query.date.trim() : '';

    const rawLimit = Number(req.query.limit);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 30;
    const cursorId = req.query.cursor ? Number(req.query.cursor) : undefined;

    const whereClause = {
      type: "call",
      conversation: {
        participants: {
          some: { userId: userId }
        }
      }
    };

    if (dateQuery) {
      const startOfDay = new Date(dateQuery);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateQuery);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.createdAt = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    if (q) {
      whereClause.conversation = {
        AND: [
          { participants: { some: { userId: userId } } },
          {
            participants: {
              some: {
                userId: { not: userId },
                user: {
                  OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } }
                  ]
                }
              }
            }
          }
        ]
      };
    }

    const rawCalls = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, profileImage: true, email: true } },
        conversation: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, profileImage: true, email: true } }
              }
            }
          }
        }
      },
      take: limit + 1,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {})
    });

    let nextCursor = null;
    let page = rawCalls;
    if (rawCalls.length > limit) {
      const nextItem = rawCalls.pop();
      nextCursor = nextItem?.id ? String(nextItem.id) : null;
      page = rawCalls;
    }

    const calls = page.map(msg => MessageMapper.toCallHistoryItem(msg));

    return res.status(200).json({ message: "Call history fetched", status: true, calls, nextCursor });
  } catch (error) {
    next(error);
  }
};
