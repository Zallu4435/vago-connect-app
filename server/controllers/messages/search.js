import { MessageService } from "../../services/MessageService.js";

// GET /api/messages/chats/:id/search?q=term
export const searchMessages = async (req, res, next) => {
    try {
        const conversationId = Number(req.params.id);
        const userId = Number(req?.user?.userId);
        const q = typeof req.query.q === 'string' ? req.query.q.trim() : "";

        const messages = await MessageService.searchMessages({ conversationId, userId, q });

        return res.status(200).json({ messages });
    } catch (error) {
        const status = error?.status || 500;
        res.status(status).json({ message: error.message || "Internal error" });
    }
};
