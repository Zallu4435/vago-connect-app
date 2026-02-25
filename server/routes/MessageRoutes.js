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
  clearChat,
  deleteChatForMe,
  archiveChat,
  pinChat,
  muteChat,
  getChatMedia,
  downloadMedia,
  searchChatMedia,
  createGroup,
  addGroupMembers,
  removeGroupMembers,
  updateGroupRole,
  updateGroupSettings,
  leaveGroup,
  deleteGroup,
  getCallHistory
} from "../controllers/MessageController.js";
import multer from "multer";
import { verifyAccessToken } from "../middlewares/AuthMiddleware.js";

const messageRouter = Router();

const memory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Audio-only upload (15MB max)
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("audio/")) return cb(null, true);
    cb(new Error("Only audio files are allowed"));
  },
});

// Image-only upload (25MB max)
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) return cb(null, true);
    cb(new Error("Only image files are allowed"));
  },
});

// Video-only upload (50MB max)
const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("video/")) return cb(null, true);
    cb(new Error("Only video files are allowed"));
  },
});

messageRouter.post("/add-message", verifyAccessToken, addMessage);
messageRouter.get("/get-messages/:from/:to", verifyAccessToken, getMessages);
messageRouter.post("/add-image", verifyAccessToken, imageUpload.single("image"), addImage);
// Dedicated voice message endpoint
messageRouter.post("/audio", verifyAccessToken, audioUpload.single("audio"), addAudio);
// Dedicated video message endpoint
messageRouter.post("/video", verifyAccessToken, videoUpload.single("video"), addVideo);
// Generic file upload (documents, videos, etc.)
messageRouter.post("/add-file", verifyAccessToken, memory.single("file"), addFile);
messageRouter.post("/location", verifyAccessToken, addLocation);
messageRouter.get("/get-initial-contacts/:from", verifyAccessToken, getInitialContactswithMessages);
// Group creation
messageRouter.post("/groups", verifyAccessToken, imageUpload.single("groupIcon"), createGroup);
// Group members
messageRouter.post("/groups/:groupId/members/add", verifyAccessToken, addGroupMembers);
messageRouter.post("/groups/:groupId/members/remove", verifyAccessToken, removeGroupMembers);
// Group roles
messageRouter.post("/groups/:groupId/roles", verifyAccessToken, updateGroupRole);
// Group settings
messageRouter.patch("/groups/:groupId/settings", verifyAccessToken, updateGroupSettings);
messageRouter.post("/groups/:groupId/leave", verifyAccessToken, leaveGroup);
messageRouter.delete("/groups/:groupId", verifyAccessToken, deleteGroup);

messageRouter.put("/update-status", verifyAccessToken, updateMessageStatus);
messageRouter.patch("/:id/edit", verifyAccessToken, editMessage);
messageRouter.delete("/:id", verifyAccessToken, deleteMessage);
messageRouter.post("/forward", verifyAccessToken, forwardMessages);
messageRouter.post("/:id/star", verifyAccessToken, starMessage);
messageRouter.post("/:id/react", verifyAccessToken, reactToMessage);
// Chat maintenance
messageRouter.delete("/chats/:id/clear", verifyAccessToken, clearChat);
messageRouter.delete("/chats/:id", verifyAccessToken, deleteChatForMe);
messageRouter.post("/chats/:id/archive", verifyAccessToken, archiveChat);
messageRouter.post("/chats/:id/pin", verifyAccessToken, pinChat);
messageRouter.post("/chats/:id/mute", verifyAccessToken, muteChat);
// Media gallery and download
messageRouter.get("/chats/:id/media", verifyAccessToken, getChatMedia);
messageRouter.get("/chats/:id/media/search", verifyAccessToken, searchChatMedia);
messageRouter.get("/media/:mediaId/download", verifyAccessToken, downloadMedia);
// Calls Route
messageRouter.get("/calls/:userId", verifyAccessToken, getCallHistory);

export default messageRouter;