import { ChatService } from "../../services/ChatService.js";

export const clearChat = async (req, res, next) => {
  try {
    const conversationId = Number(req.params.id);
    const userId = Number(req?.user?.userId);

    await ChatService.clearChat({
      userId,
      conversationId,
    });

    return res.status(204).send();
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};
