import { ChatService } from "../../services/ChatService.js";

export const pinChat = async (req, res, next) => {
  try {
    const conversationId = Number(req.params.id);
    const userId = Number(req?.user?.userId);
    const { pinned } = req.body || {};

    const result = await ChatService.pinChat({
      userId,
      conversationId,
      pinned,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};
