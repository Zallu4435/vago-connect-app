import { Router } from "express";
import {
  addMessage,
  getMessages,
  addImage,
  addAudio,
  addVideo,
  addLocation,
  getInitialContactswithMessages,
  updateMessageStatus,
  addFile,
  editMessage,
  deleteMessage,
  forwardMessages,
  starMessage,
  reactToMessage,
  proxyDownload
} from "../controllers/MessageController.js";
import { verifyAccessToken } from "../middlewares/AuthMiddleware.js";
import { memory, audioUpload, imageUpload, videoUpload } from "../middlewares/FileUploadMiddleware.js";

import GroupRoutes from "./GroupRoutes.js";
import ChatRoutes from "./ChatRoutes.js";
import CallRoutes from "./CallRoutes.js";

const messageRouter = Router();

// Sub-routers mapped to maintain backwards-compatible frontend URLs
messageRouter.use("/groups", GroupRoutes);
messageRouter.use("/chats", ChatRoutes);
messageRouter.use("/calls", CallRoutes);

// Core Message Interactions
messageRouter.post("/", verifyAccessToken, addMessage);
messageRouter.get("/contacts", verifyAccessToken, getInitialContactswithMessages);
messageRouter.get("/:to", verifyAccessToken, getMessages);
messageRouter.post("/image", verifyAccessToken, imageUpload.single("image"), addImage);
messageRouter.post("/audio", verifyAccessToken, audioUpload.single("audio"), addAudio);
messageRouter.post("/video", verifyAccessToken, videoUpload.single("video"), addVideo);
messageRouter.post("/file", verifyAccessToken, memory.single("file"), addFile);
messageRouter.post("/location", verifyAccessToken, addLocation);
messageRouter.patch("/status", verifyAccessToken, updateMessageStatus);
messageRouter.patch("/:id", verifyAccessToken, editMessage);
messageRouter.delete("/:id", verifyAccessToken, deleteMessage);
messageRouter.post("/forward", verifyAccessToken, forwardMessages);
messageRouter.post("/:id/star", verifyAccessToken, starMessage);
messageRouter.post("/:id/react", verifyAccessToken, reactToMessage);
messageRouter.get("/media/download", proxyDownload);

export default messageRouter;