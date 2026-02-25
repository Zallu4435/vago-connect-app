import { MessageService } from "../../services/MessageService.js";

export const updateMessageStatus = async (req, res, next) => {
  try {
    const { messageId, status } = req.body || {};

    const result = await MessageService.updateMessageStatus({ messageId, status });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ status: false, message: error.message || "Internal error" });
  }
};
