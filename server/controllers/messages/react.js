import { MessageService } from "../../services/MessageService.js";

export const reactToMessage = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { emoji } = req.body || {};
    if (!id || typeof emoji !== 'string' || !emoji.trim()) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const requesterId = Number(req?.user?.userId);

    const { reactions } = await MessageService.reactToMessage({ messageId: id, emoji, requesterId });
    return res.status(200).json({ id, reactions });
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};
