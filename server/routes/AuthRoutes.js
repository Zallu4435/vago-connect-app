import { Router } from "express";
import { checkUser, getAllUser, onBoardUser, login, refresh, logout } from "../controllers/AuthController.js";
import cookieParser from "cookie-parser";

const router = Router();
router.use(cookieParser());

router.post("/check-user", checkUser)
router.post("/onboard-user", onBoardUser)
router.get("/all-users", getAllUser)

// New auth endpoints
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router
