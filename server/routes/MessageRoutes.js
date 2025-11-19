import { Router } from "express";
import { addMessage, getMessages, addImage, addAudio, getInitialContactswithMessages, updateMessageStatus } from "../controllers/MessageController.js";
import multer from "multer";
import { verifyAccessToken } from "../middlewares/AuthMiddleware.js";

const messageRouter = Router();

const upload = multer({dest: "upload/recordings"})
const uploadImage = multer({ dest: "upload/images" })

messageRouter.post("/add-message", verifyAccessToken, addMessage);
messageRouter.get("/get-messages/:from/:to", verifyAccessToken, getMessages);
messageRouter.post("/add-image", verifyAccessToken, uploadImage.single("image"), addImage);
messageRouter.post("/add-audio", verifyAccessToken, upload.single("audio"), addAudio);
messageRouter.get("/get-initial-contacts/:from", verifyAccessToken, getInitialContactswithMessages);
messageRouter.put("/update-status", verifyAccessToken, updateMessageStatus);

export default messageRouter;