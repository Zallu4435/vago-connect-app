import { UserService } from "../../services/UserService.js";

export const blockUser = async (req, res, next) => {
  try {
    const blockerId = Number(req?.user?.userId);
    const blockedId = Number(req.params.userId);

    const result = await UserService.blockUser({
      blockerId,
      blockedId,
    });

    return res.status(201).json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    const blockerId = Number(req?.user?.userId);
    const blockedId = Number(req.params.userId);

    const result = await UserService.unblockUser({
      blockerId,
      blockedId,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};
