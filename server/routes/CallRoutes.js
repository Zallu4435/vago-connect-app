import { Router } from "express";
import { verifyAccessToken } from "../middlewares/AuthMiddleware.js";
import { getCallHistory } from "../controllers/MessageController.js";

const router = Router();

// /api/messages/calls
router.get("/:userId", verifyAccessToken, getCallHistory);

export default router;
