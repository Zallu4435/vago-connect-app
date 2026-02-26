import { UserService } from "../../services/UserService.js";

export const toggleBlockUser = async (req, res, next) => {
  try {
    const blockerId = Number(req?.user?.userId);
    const blockedId = Number(req.params.userId);
    const { isBlocked } = req.body;

    if (typeof isBlocked !== "boolean") {
      return res.status(400).json({ message: "isBlocked boolean is required" });
    }

    let result;
    if (isBlocked) {
      result = await UserService.blockUser({ blockerId, blockedId });
      return res.status(201).json(result);
    } else {
      result = await UserService.unblockUser({ blockerId, blockedId });
      return res.status(200).json(result);
    }
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};
