import { Router } from "express";
import { addMessage, getMessages, addImage, addAudio, getInitialContactswithMessages, updateMessageStatus } from "../controllers/MessageController.js";
import multer from "multer";

const messageRouter = Router();

const upload = multer({dest: "upload/recordings"})
const uploadImage = multer({ dest: "upload/images" })

messageRouter.post("/add-message", addMessage);
messageRouter.get("/get-messages/:from/:to", getMessages);
messageRouter.post("/add-image", uploadImage.single("image"), addImage);
messageRouter.post("/add-audio", upload.single("audio"), addAudio);
messageRouter.get("/get-initial-contacts/:from", getInitialContactswithMessages);
messageRouter.put("/update-status", updateMessageStatus);

export default messageRouter;