import getPrismaInstance from "../../utils/PrismaClient.js";

// GET /api/messages/chats/:id/search?q=term
export const searchMessages = async (req, res, next) => {
    try {
        const prisma = getPrismaInstance();
        const conversationId = Number(req.params.id);
        const userId = Number(req?.user?.userId);
        const { q = "" } = req.query;

        if (!conversationId) return res.status(400).json({ message: "Invalid conversation id" });

        // Validate participant
        const participant = await prisma.conversationParticipant.findFirst({
            where: { conversationId, userId }
        });

        if (!participant || participant.isDeleted) {
            return res.status(403).json({ message: "Not a participant" });
        }

        const clearedAt = participant.clearedAt || null;

        if (!q.trim()) {
            return res.status(200).json({ messages: [] });
        }

        const messages = await prisma.message.findMany({
            where: {
                conversationId,
                isSystemMessage: false,
                ...(clearedAt ? { createdAt: { gt: clearedAt } } : {}),
                NOT: {
                    deletedBy: {
                        array_contains: userId,
                    },
                },
                OR: [
                    { content: { contains: q, mode: 'insensitive' } },
                    { caption: { contains: q, mode: 'insensitive' } },
                    { fileName: { contains: q, mode: 'insensitive' } },
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 100, // Reasonable limit for live search
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                    }
                },
            }
        });

        return res.status(200).json({ messages });
    } catch (error) {
        next(error);
    }
};
