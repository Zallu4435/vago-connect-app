import { ChatService } from "../../services/ChatService.js";

export const muteChat = async (req, res, next) => {
  try {
    const conversationId = Number(req.params.id);
    const userId = Number(req?.user?.userId);
    const { muted, until } = req.body || {};

    const result = await ChatService.muteChat({
      userId,
      conversationId,
      muted,
      until,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};
