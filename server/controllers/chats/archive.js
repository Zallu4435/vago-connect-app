import { ChatService } from "../../services/ChatService.js";

export const archiveChat = async (req, res, next) => {
  try {
    const conversationId = Number(req.params.id);
    const userId = Number(req?.user?.userId);
    const { archived, keepArchived } = req.body || {};

    const result = await ChatService.archiveChat({
      userId,
      conversationId,
      archived,
      keepArchived,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};
