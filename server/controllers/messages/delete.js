import { MessageService } from "../../services/MessageService.js";

export const deleteMessage = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const deleteType = (req.query.deleteType || "").toString();
    if (!id || (deleteType !== "forMe" && deleteType !== "forEveryone")) {
      return res.status(400).json({ message: "Invalid deleteType or id" });
    }

    const requesterId = Number(req?.user?.userId);

    const result = await MessageService.deleteMessage({ messageId: id, deleteType, requesterId });

    if (result.status === 'idempotent') {
      if (deleteType === "forEveryone") {
        return res.status(200).json({ id: result.id, deleteType: "forEveryone" });
      }
      return res.status(200).json(result.message);
    }

    if (deleteType === "forEveryone") {
      return res.status(200).json({ id: result.id, deleteType: "forEveryone" });
    }

    return res.status(200).json(result.message);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};
