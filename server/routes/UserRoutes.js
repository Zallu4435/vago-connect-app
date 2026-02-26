import { Router } from "express";
import { verifyAccessToken } from "../middlewares/AuthMiddleware.js";
import { toggleBlockUser } from "../controllers/users/block.js";
import { reportUser, listReports } from "../controllers/users/report.js";

const router = Router();

router.put("/:userId/block", verifyAccessToken, toggleBlockUser);
router.post("/report/:userId", verifyAccessToken, reportUser);
// Admin (or protected) listing endpoint
router.get("/reports", verifyAccessToken, listReports);

export default router;
