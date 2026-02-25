import { Router } from "express";
import AuthRoutes from "./AuthRoutes.js";
import MessageRoutes from "./MessageRoutes.js";
import UserRoutes from "./UserRoutes.js";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/messages", MessageRoutes);
router.use("/users", UserRoutes);

export default router;
