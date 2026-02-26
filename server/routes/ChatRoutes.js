import { Router } from "express";
import { verifyAccessToken } from "../middlewares/AuthMiddleware.js";
import {
    clearChat,
    deleteChatForMe,
    archiveChat,
    pinChat,
    muteChat,
    getChatMedia,
    searchChatMedia,
    searchMessages,
} from "../controllers/MessageController.js";

const router = Router();

// /api/messages/chats
router.delete("/:id/messages", verifyAccessToken, clearChat);
router.delete("/:id", verifyAccessToken, deleteChatForMe);
router.patch("/:id/archive", verifyAccessToken, archiveChat);
router.patch("/:id/pin", verifyAccessToken, pinChat);
router.patch("/:id/mute", verifyAccessToken, muteChat);
router.get("/:id/media", verifyAccessToken, getChatMedia);
// Differentiated by ?q= in controller for media search or handled explicitly by overriding route order. Wait, keep distinct paths for search if they rely on different controllers.
router.get("/:id/media/search", verifyAccessToken, searchChatMedia);
router.get("/:id/messages/search", verifyAccessToken, searchMessages);

export default router;
