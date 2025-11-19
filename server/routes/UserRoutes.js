import { Router } from "express";
import { verifyAccessToken } from "../middlewares/AuthMiddleware.js";
import { blockUser, unblockUser } from "../controllers/users/block.js";
import { reportUser, listReports } from "../controllers/users/report.js";

const router = Router();

router.post("/block/:userId", verifyAccessToken, blockUser);
router.delete("/block/:userId", verifyAccessToken, unblockUser);
router.post("/report/:userId", verifyAccessToken, reportUser);
// Admin (or protected) listing endpoint
router.get("/reports", verifyAccessToken, listReports);

export default router;
