import { Router } from "express";
import { verifyAccessToken } from "../middlewares/AuthMiddleware.js";
import { imageUpload } from "../middlewares/FileUploadMiddleware.js";
import {
    createGroup,
    addGroupMembers,
    removeGroupMembers,
    updateGroupRole,
    updateGroupSettings,
    leaveGroup,
    deleteGroup,
} from "../controllers/MessageController.js";

const router = Router();

// /api/messages/groups
router.post("/", verifyAccessToken, imageUpload.single("groupIcon"), createGroup);
router.post("/:groupId/members/add", verifyAccessToken, addGroupMembers);
router.post("/:groupId/members/remove", verifyAccessToken, removeGroupMembers);
router.post("/:groupId/roles", verifyAccessToken, updateGroupRole);
router.patch("/:groupId/settings", verifyAccessToken, imageUpload.single("groupIcon"), updateGroupSettings);
router.post("/:groupId/leave", verifyAccessToken, leaveGroup);
router.delete("/:groupId", verifyAccessToken, deleteGroup);

export default router;
