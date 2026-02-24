import getPrismaInstance from "../../utils/PrismaClient.js";
import { uploadBuffer } from "../../utils/Cloudinary.js";
import { getOrCreateDirectConversation, isBlockedBetweenUsers } from "./helpers.js";

function buildMediaFileData(messageId, cld, file, extra = {}) {
  return {
    messageId,
    storageKey: cld.public_id,
    originalName: file?.originalname || null,
    mimeType: file?.mimetype || null,
    fileSize: BigInt(cld.bytes || 0),
    width: cld.width || null,
    height: cld.height || null,
    duration: cld.duration ? Math.round(cld.duration) : null,
    cloudinaryPublicId: cld.public_id,
    cloudinaryVersion: cld.version,
    cloudinaryResourceType: cld.resource_type,
    cloudinaryFormat: cld.format || null,
    cloudinaryFolder: (cld.folder || null),
    cloudinaryAssetId: cld.asset_id || null,
    ...extra,
  };
}

function toMinimalMessage(m) {
  if (!m) return m;
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    type: m.type,
    content: m.content,
    caption: m.caption || undefined,
    status: m.status,
    createdAt: m.createdAt,
    ...(m.replyToMessageId ? { replyToMessageId: m.replyToMessageId } : {}),
    ...(m.quotedMessage ? { quotedMessage: m.quotedMessage } : {}),
    ...(m.isForwarded ? { isForwarded: m.isForwarded } : {}),
  };
}

async function prepareReply(prisma, convoId, replyToMessageId, requesterId) {
  if (!replyToMessageId) return { replyToMessageId: undefined, quotedMessage: undefined };
  const replyId = Number(replyToMessageId);
  if (!replyId) return { replyToMessageId: undefined, quotedMessage: undefined };
  const replyMsg = await prisma.message.findUnique({ where: { id: replyId } });
  if (!replyMsg) throw Object.assign(new Error("Reply message not found"), { status: 404 });
  if (replyMsg.conversationId !== convoId) throw Object.assign(new Error("Reply target not in same conversation"), { status: 400 });
  return {
    replyToMessageId: replyMsg.id,
    quotedMessage: {
      id: replyMsg.id,
      content: replyMsg.content,
      type: replyMsg.type,
      senderId: replyMsg.senderId,
    },
  };
}

function emitMessageSent(conversation, message) {
  try {
    if (!global?.io || !global?.onlineUsers) return;
    conversation.participants.forEach((p) => {
      const sid = global.onlineUsers.get(String(p.userId)) || global.onlineUsers.get(p.userId);
      if (sid) global.io.to(sid).emit("message-sent", { message });
    });
  } catch (_) { }
}

export const addMessage = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { content, from, to, type = "text", replyToMessageId, isGroup } = req.body;
    const recipientOnline = global.onlineUsers?.get?.(to);

    if (!content || !from || !to) {
      return res.status(400).json({ message: "Invalid data" });
    }

    // Block check (either direction)
    const blocked = await isBlockedBetweenUsers(prisma, from, to);
    if (blocked) return res.status(403).json({ message: "Cannot send message. User is blocked." });
    const convo = await resolveConversation(prisma, from, to, isGroup);
    const replyData = await prepareReply(prisma, convo.id, replyToMessageId, Number(from));
    const newMessage = await prisma.message.create({
      data: {
        conversationId: convo.id,
        senderId: Number(from),
        type,
        content,
        status: recipientOnline ? "delivered" : "sent",
        replyToMessageId: replyData.replyToMessageId,
        quotedMessage: replyData.quotedMessage,
      },
    });
    emitMessageSent(convo, newMessage);
    return res.status(201).json(toMinimalMessage(newMessage));
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};

export const addVideo = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { from, to, replyToMessageId, caption, isGroup } = req.body;
    if (!req.file || !from || !to) {
      return res.status(400).json({ message: "Invalid data" });
    }
    if (!(req.file.mimetype || '').startsWith('video/')) {
      return res.status(400).json({ message: "Only video files are allowed" });
    }
    const recipientOnline = global.onlineUsers?.get?.(to);
    const cld = await uploadBuffer(req.file.buffer, {
      folder: process.env.CLOUDINARY_FOLDER || undefined,
      resource_type: 'video',
    });
    // Enforce max duration 90s if Cloudinary provided duration
    const durationSec = cld?.duration ? Number(cld.duration) : null;
    if (durationSec && durationSec > 90) {
      return res.status(400).json({ message: "Video duration exceeds 90 seconds" });
    }
    const contentUrl = cld.secure_url;
    const blocked = await isBlockedBetweenUsers(prisma, from, to);
    if (blocked) return res.status(403).json({ message: "Cannot send message. User is blocked." });
    const convo = await resolveConversation(prisma, from, to, isGroup);
    const replyData = await prepareReply(prisma, convo.id, replyToMessageId, Number(from));
    const newMessage = await prisma.message.create({
      data: {
        conversationId: convo.id,
        senderId: Number(from),
        type: "video",
        content: contentUrl,
        status: recipientOnline ? "delivered" : "sent",
        caption: caption && String(caption).trim() ? String(caption).trim() : null,
        duration: durationSec ? Math.round(durationSec) : null,
        replyToMessageId: replyData.replyToMessageId,
        quotedMessage: replyData.quotedMessage,
      },
    });
    try { await prisma.mediaFile.create({ data: buildMediaFileData(newMessage.id, cld, req.file) }); } catch (_) { }
    emitMessageSent(convo, newMessage);
    return res.status(201).json(toMinimalMessage(newMessage));
  } catch (error) {
    next(error);
  }
};
export const addImage = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { from, to, replyToMessageId, caption, isGroup } = req.body;
    try {
      console.log('[Image:addImage] start', {
        from,
        to,
        replyToMessageId,
        hasFile: Boolean(req.file),
        fileMeta: req.file
          ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            bufferLen: req.file.buffer ? req.file.buffer.length : 0,
          }
          : null,
        ts: Date.now(),
      });
    } catch (_) { }
    if (!req.file || !from || !to) {
      return res.status(400).json({ message: "Invalid data" });
    }
    const recipientOnline = global.onlineUsers?.get?.(to);
    try {
      console.log('[Image:addImage] uploading to Cloudinary', {
        mimetype: req.file?.mimetype,
        bufferLen: req.file?.buffer?.length,
      });
    } catch (_) { }
    const cld = await uploadBuffer(req.file.buffer, {
      folder: process.env.CLOUDINARY_FOLDER || undefined,
      resource_type: 'image',
    });
    try {
      console.log('[Image:addImage] upload success', {
        public_id: cld?.public_id,
        url: cld?.secure_url,
        bytes: cld?.bytes,
        width: cld?.width,
        height: cld?.height,
      });
    } catch (_) { }
    const contentUrl = cld.secure_url;
    const blocked = await isBlockedBetweenUsers(prisma, from, to);
    if (blocked) return res.status(403).json({ message: "Cannot send message. User is blocked." });
    const convo = await resolveConversation(prisma, from, to, isGroup);
    const replyData = await prepareReply(prisma, convo.id, replyToMessageId, Number(from));
    try {
      console.log('[Image:addImage] creating message', {
        conversationId: convo?.id,
        senderId: Number(from),
        hasUrl: Boolean(contentUrl),
      });
    } catch (_) { }
    const newMessage = await prisma.message.create({
      data: {
        conversationId: convo.id,
        senderId: Number(from),
        type: "image",
        content: contentUrl,
        status: recipientOnline ? "delivered" : "sent",
        caption: caption && String(caption).trim() ? String(caption).trim() : null,
        replyToMessageId: replyData.replyToMessageId,
        quotedMessage: replyData.quotedMessage,
      },
    });
    try {
      await prisma.mediaFile.create({ data: buildMediaFileData(newMessage.id, cld, req.file) });
      try { console.log('[Image:addImage] mediaFile persisted'); } catch (_) { }
    } catch (e) {
      try { console.warn('[Image:addImage] mediaFile persist failed', { message: e?.message }); } catch (_) { }
    }
    emitMessageSent(convo, newMessage);
    try { console.log('[Image:addImage] done', { messageId: newMessage?.id }); } catch (_) { }
    return res.status(201).json(toMinimalMessage(newMessage));
  } catch (error) {
    try {
      console.error('[Image:addImage] error', { message: error?.message, stack: error?.stack });
    } catch (_) { }
    next(error);
  }
};

export const addAudio = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { from, to, replyToMessageId, caption, isGroup } = req.body;
    if (!req.file || !from || !to) {
      return res.status(400).json({ message: "Invalid data" });
    }
    const recipientOnline = global.onlineUsers?.get?.(to);
    const cld = await uploadBuffer(req.file.buffer, {
      folder: process.env.CLOUDINARY_FOLDER || undefined,
      resource_type: 'auto',
    });
    const contentUrl = cld.secure_url;
    const blocked = await isBlockedBetweenUsers(prisma, from, to);
    if (blocked) return res.status(403).json({ message: "Cannot send message. User is blocked." });
    const convo = await resolveConversation(prisma, from, to, isGroup);
    const replyData = await prepareReply(prisma, convo.id, replyToMessageId, Number(from));
    const newMessage = await prisma.message.create({
      data: {
        conversationId: convo.id,
        senderId: Number(from),
        type: "audio",
        content: contentUrl,
        status: recipientOnline ? "delivered" : "sent",
        caption: caption && String(caption).trim() ? String(caption).trim() : null,
        replyToMessageId: replyData.replyToMessageId,
        quotedMessage: replyData.quotedMessage,
      },
    });
    try {
      await prisma.mediaFile.create({
        data: {
          messageId: newMessage.id,
          storageKey: cld.public_id,
          originalName: req.file.originalname || null,
          mimeType: req.file.mimetype || null,
          fileSize: BigInt(cld.bytes || 0),
          width: cld.width || null,
          height: cld.height || null,
          duration: cld.duration ? Math.round(cld.duration) : null,
          cloudinaryPublicId: cld.public_id,
          cloudinaryVersion: cld.version,
          cloudinaryResourceType: cld.resource_type,
          cloudinaryFormat: cld.format || null,
          cloudinaryFolder: (cld.folder || null),
          cloudinaryAssetId: cld.asset_id || null,
        },
      });
    } catch (_) { }
    emitMessageSent(convo, newMessage);
    return res.status(201).json(toMinimalMessage(newMessage));
  } catch (error) {
    next(error);
  }
};

export const addFile = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { from, to, replyToMessageId, caption, isGroup } = req.body;
    if (!req.file || !from || !to) {
      return res.status(400).json({ message: "Invalid data" });
    }
    const recipientOnline = global.onlineUsers?.get?.(to);
    const mime = req.file.mimetype || "application/octet-stream";
    const inferredType = mime.startsWith("image/")
      ? "image"
      : mime.startsWith("video/")
        ? "video"
        : mime.startsWith("audio/")
          ? "audio"
          : "document";
    const cld = await uploadBuffer(req.file.buffer, {
      folder: process.env.CLOUDINARY_FOLDER || undefined,
      resource_type: inferredType === 'image' ? 'image' : inferredType === 'video' ? 'video' : 'auto',
    });
    const contentUrl = cld.secure_url;
    const blocked = await isBlockedBetweenUsers(prisma, from, to);
    if (blocked) return res.status(403).json({ message: "Cannot send message. User is blocked." });
    const convo = await resolveConversation(prisma, from, to, isGroup);
    const replyData = await prepareReply(prisma, convo.id, replyToMessageId, Number(from));
    const newMessage = await prisma.message.create({
      data: {
        conversationId: convo.id,
        senderId: Number(from),
        type: inferredType,
        content: contentUrl,
        status: recipientOnline ? "delivered" : "sent",
        caption: caption && String(caption).trim() ? String(caption).trim() : null,
        replyToMessageId: replyData.replyToMessageId,
        quotedMessage: replyData.quotedMessage,
      },
    });
    try {
      await prisma.mediaFile.create({
        data: {
          messageId: newMessage.id,
          storageKey: cld.public_id,
          originalName: req.file.originalname || null,
          mimeType: req.file.mimetype || null,
          fileSize: BigInt(cld.bytes || 0),
          width: cld.width || null,
          height: cld.height || null,
          duration: cld.duration ? Math.round(cld.duration) : null,
          cloudinaryPublicId: cld.public_id,
          cloudinaryVersion: cld.version,
          cloudinaryResourceType: cld.resource_type,
          cloudinaryFormat: cld.format || null,
          cloudinaryFolder: (cld.folder || null),
          cloudinaryAssetId: cld.asset_id || null,
        },
      });
    } catch (_) { }
    emitMessageSent(convo, newMessage);
    return res.status(201).json(toMinimalMessage(newMessage));
  } catch (error) {
    next(error);
  }
};

export const addLocation = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { from, to, latitude, longitude, name, address, replyToMessageId, isGroup } = req.body || {};
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
    const blocked = await isBlockedBetweenUsers(prisma, from, to);
    if (blocked) return res.status(403).json({ message: "Cannot send message. User is blocked." });
    const convo = await resolveConversation(prisma, from, to, isGroup);
    const recipientOnline = global.onlineUsers?.get?.(to);
    const replyData = await prepareReply(prisma, convo.id, replyToMessageId, Number(from));
    const payload = {
      lat,
      lng,
      ...(name ? { name } : {}),
      ...(address ? { address } : {}),
    };
    const newMessage = await prisma.message.create({
      data: {
        conversationId: convo.id,
        senderId: Number(from),
        type: "location",
        content: JSON.stringify(payload),
        status: recipientOnline ? "delivered" : "sent",
        replyToMessageId: replyData.replyToMessageId,
        quotedMessage: replyData.quotedMessage,
      },
    });
    emitMessageSent(convo, newMessage);
    return res.status(201).json(toMinimalMessage(newMessage));
  } catch (error) {
    next(error);
  }
};
