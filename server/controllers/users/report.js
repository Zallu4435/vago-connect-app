import { UserService } from "../../services/UserService.js";

export const reportUser = async (req, res, next) => {
  try {
    const reporterId = Number(req?.user?.userId);
    const reportedId = Number(req.params.userId);
    const { reason, description, conversationId, softDelete } = req.body || {};

    const result = await UserService.reportUser({
      reporterId,
      reportedId,
      reason,
      description,
      conversationId,
      softDelete,
    });

    return res.status(201).json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};

export const listReports = async (_req, res, next) => {
  try {
    const result = await UserService.listReports();
    return res.status(200).json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};
