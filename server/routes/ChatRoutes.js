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
router.delete("/:id/clear", verifyAccessToken, clearChat);
router.delete("/:id", verifyAccessToken, deleteChatForMe);
router.post("/:id/archive", verifyAccessToken, archiveChat);
router.post("/:id/pin", verifyAccessToken, pinChat);
router.post("/:id/mute", verifyAccessToken, muteChat);
router.get("/:id/media", verifyAccessToken, getChatMedia);
router.get("/:id/media/search", verifyAccessToken, searchChatMedia);
router.get("/:id/messages/search", verifyAccessToken, searchMessages);

export default router;
