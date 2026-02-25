import { MessageService } from "../../services/MessageService.js";

export const forwardMessages = async (req, res, next) => {
  try {
    const requesterId = Number(req?.user?.userId);
    const { messageIds, toConversationIds } = req.body || {};

    if (!Array.isArray(messageIds) || !messageIds.length || messageIds.length > 5) {
      return res.status(400).json({ message: "messageIds must be an array of 1..5 ids" });
    }
    if (!Array.isArray(toConversationIds) || !toConversationIds.length || toConversationIds.length > 5) {
      return res.status(400).json({ message: "toConversationIds must be an array of 1..5 ids" });
    }

    const created = await MessageService.forwardMessages({ messageIds, toConversationIds, requesterId });

    return res.status(201).json({ messages: created });
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};
