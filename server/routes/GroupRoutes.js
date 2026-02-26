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
router.post("/:groupId/members", verifyAccessToken, addGroupMembers);
router.delete("/:groupId/members", verifyAccessToken, removeGroupMembers);
router.patch("/:groupId/roles", verifyAccessToken, updateGroupRole);
router.patch("/:groupId", verifyAccessToken, imageUpload.single("groupIcon"), updateGroupSettings);
router.delete("/:groupId/members/me", verifyAccessToken, leaveGroup);
router.delete("/:groupId", verifyAccessToken, deleteGroup);

export default router;
