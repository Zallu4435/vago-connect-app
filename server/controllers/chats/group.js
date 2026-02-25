import { ChatService } from "../../services/ChatService.js";

export const createGroup = async (req, res, next) => {
  try {
    const creatorId = Number(req?.user?.userId);
    const { groupName, groupDescription, groupIconUrl, memberIds } = req.body || {};

    const result = await ChatService.createGroup({
      creatorId,
      groupName,
      groupDescription,
      groupIconUrl,
      memberIds,
      file: req.file,
    });

    return res.status(201).json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};

export const addGroupMembers = async (req, res, next) => {
  try {
    const adminId = Number(req?.user?.userId);
    const groupId = Number(req.params.groupId);
    const { members } = req.body || {};

    const result = await ChatService.addGroupMembers({
      adminId,
      groupId,
      members,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};

export const removeGroupMembers = async (req, res, next) => {
  try {
    const adminId = Number(req?.user?.userId);
    const groupId = Number(req.params.groupId);
    const { members } = req.body || {};

    const result = await ChatService.removeGroupMembers({
      adminId,
      groupId,
      members,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};

export const updateGroupSettings = async (req, res, next) => {
  try {
    const adminId = Number(req?.user?.userId);
    const groupId = Number(req.params.groupId);
    const { groupName, groupDescription, groupIconUrl } = req.body || {};

    const result = await ChatService.updateGroupSettings({
      adminId,
      groupId,
      groupName,
      groupDescription,
      groupIconUrl,
      file: req.file,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};

export const updateGroupRole = async (req, res, next) => {
  try {
    const adminId = Number(req?.user?.userId);
    const groupId = Number(req.params.groupId);
    const { userId, role, permissions } = req.body || {};

    const result = await ChatService.updateGroupRole({
      adminId,
      groupId,
      userId,
      role,
      permissions,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};

export const leaveGroup = async (req, res, next) => {
  try {
    const userId = Number(req?.user?.userId);
    const groupId = Number(req.params.groupId);

    const result = await ChatService.leaveGroup({
      userId,
      groupId,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};

export const deleteGroup = async (req, res, next) => {
  try {
    const adminId = Number(req?.user?.userId);
    const groupId = Number(req.params.groupId);

    const result = await ChatService.deleteGroup({
      adminId,
      groupId,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};
