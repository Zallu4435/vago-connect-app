import { MessageService } from "../../services/MessageService.js";

// GET /api/messages/chats/:id/search?q=term
export const searchMessages = async (req, res, next) => {
    try {
        const conversationId = Number(req.params.id);
        const userId = Number(req?.user?.userId);
        const q = typeof req.query.q === 'string' ? req.query.q.trim() : "";

        const rawLimit = Number(req.query.limit);
        const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 30;
        const cursorId = req.query.cursor ? Number(req.query.cursor) : undefined;

        const result = await MessageService.searchMessages({ conversationId, userId, q, limit, cursorId });

        return res.status(200).json(result);
    } catch (error) {
        const status = error?.status || 500;
        res.status(status).json({ message: error.message || "Internal error" });
    }
};
