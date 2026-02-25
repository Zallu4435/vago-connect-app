import { MessageService } from "../../services/MessageService.js";

export const editMessage = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { content } = req.body || {};
    if (!id || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    const requesterId = Number(req?.user?.userId);
    const result = await MessageService.editMessage({ messageId: id, content, requesterId });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};
