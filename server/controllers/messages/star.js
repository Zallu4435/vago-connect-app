import { MessageService } from "../../services/MessageService.js";

export const starMessage = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { starred } = req.body || {};
    if (!id || typeof starred !== 'boolean') {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const requesterId = Number(req?.user?.userId);

    const result = await MessageService.starMessage({ messageId: id, starred, requesterId });
    return res.status(200).json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};
