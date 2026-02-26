import { MessageService } from "../../services/MessageService.js";
import { MessageMapper } from "../../utils/mappers/MessageMapper.js";
import { SocketEmitter } from "../../utils/SocketEmitter.js";


export const addMessage = async (req, res, next) => {
  try {
    const { content, from, to, type = "text", replyToMessageId, isGroup, tempId } = req.body;
    const recipientOnline = global.onlineUsers?.has?.(to);

    if (!content || typeof content !== "string" || !content.trim() || !from || !to) {
      return res.status(400).json({ message: "Invalid data: Message content cannot be empty" });
    }

    const { convo, message } = await MessageService.addMessage({
      content,
      from,
      to,
      type,
      replyToMessageId,
      isGroup,
      recipientOnline,
    });

    SocketEmitter.emitMessageSent(convo, { ...message, tempId });
    return res.status(201).json(MessageMapper.toMinimalMessage(message));
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};

export const addVideo = async (req, res, next) => {
  try {
    const { from, to, replyToMessageId, caption, isGroup, tempId } = req.body;
    if (!req.file || !from || !to) {
      return res.status(400).json({ message: "Invalid data" });
    }
    const mime = req.file.mimetype || '';
    if (!mime.startsWith('video/')) {
      return res.status(400).json({ message: "Upload Rejected: Only video files are securely permitted via this endpoint." });
    }
    const recipientOnline = global.onlineUsers?.has?.(to);

    const { convo, message } = await MessageService.addMediaMessage({
      file: req.file,
      from,
      to,
      type: "video",
      replyToMessageId,
      caption,
      isGroup,
      recipientOnline,
    });

    SocketEmitter.emitMessageSent(convo, { ...message, tempId });
    return res.status(201).json(MessageMapper.toMinimalMessage(message));
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};
export const addImage = async (req, res, next) => {
  try {
    const { from, to, replyToMessageId, caption, isGroup, tempId } = req.body;
    if (!req.file || !from || !to) {
      return res.status(400).json({ message: "Invalid data" });
    }
    const mime = req.file.mimetype || '';
    if (!mime.startsWith('image/')) {
      return res.status(400).json({ message: "Upload Rejected: Only image files are securely permitted via this endpoint." });
    }
    const recipientOnline = global.onlineUsers?.has?.(to);

    const { convo, message } = await MessageService.addMediaMessage({
      file: req.file,
      from,
      to,
      type: "image",
      replyToMessageId,
      caption,
      isGroup,
      recipientOnline,
    });

    SocketEmitter.emitMessageSent(convo, { ...message, tempId });
    return res.status(201).json(MessageMapper.toMinimalMessage(message));
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};

export const addAudio = async (req, res, next) => {
  try {
    const { from, to, replyToMessageId, caption, isGroup, tempId } = req.body;
    if (!req.file || !from || !to) {
      return res.status(400).json({ message: "Invalid data" });
    }
    const recipientOnline = global.onlineUsers?.has?.(to);

    const { convo, message } = await MessageService.addMediaMessage({
      file: req.file,
      from,
      to,
      type: "audio",
      replyToMessageId,
      caption,
      isGroup,
      recipientOnline,
    });

    SocketEmitter.emitMessageSent(convo, { ...message, tempId });
    return res.status(201).json(MessageMapper.toMinimalMessage(message));
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};

export const addFile = async (req, res, next) => {
  try {
    const { from, to, replyToMessageId, caption, isGroup, tempId } = req.body;
    if (!req.file || !from || !to) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const mime = req.file.mimetype || "application/octet-stream";
    if (mime.startsWith("image/") || mime.startsWith("video/")) {
      return res.status(400).json({ message: "Upload Rejected: Media files (images and videos) must use their respective upload panels, not the Document panel." });
    }

    const recipientOnline = global.onlineUsers?.has?.(to);
    const inferredType = mime.startsWith("audio/") ? "audio" : "document";

    const { convo, message } = await MessageService.addMediaMessage({
      file: req.file,
      from,
      to,
      type: inferredType,
      replyToMessageId,
      caption,
      isGroup,
      recipientOnline,
    });

    SocketEmitter.emitMessageSent(convo, { ...message, tempId });
    return res.status(201).json(MessageMapper.toMinimalMessage(message));
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};

export const addLocation = async (req, res, next) => {
  try {
    const { from, to, latitude, longitude, name, address, replyToMessageId, isGroup, tempId } = req.body || {};
    if (!from || !to || typeof latitude === 'undefined' || typeof longitude === 'undefined') {
      return res.status(400).json({ message: "Invalid data" });
    }
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: "Invalid latitude/longitude" });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: "Latitude must be between -90 and 90, longitude between -180 and 180" });
    }

    const recipientOnline = global.onlineUsers?.has?.(to);
    const payload = {
      lat,
      lng,
      ...(name ? { name } : {}),
      ...(address ? { address } : {}),
    };

    const { convo, message } = await MessageService.addMessage({
      content: JSON.stringify(payload),
      from,
      to,
      type: "location",
      replyToMessageId,
      isGroup,
      recipientOnline,
    });

    SocketEmitter.emitMessageSent(convo, { ...message, tempId });
    return res.status(201).json(MessageMapper.toMinimalMessage(message));
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};
