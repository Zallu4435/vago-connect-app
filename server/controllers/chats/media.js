import getPrismaInstance from "../../utils/PrismaClient.js";
import { buildCloudinaryUrl, buildCloudinaryDownloadUrl } from "../../utils/Cloudinary.js";
import { MediaMapper } from "../../utils/mappers/MediaMapper.js";

// GET /api/chats/:id/media?type=image|video|audio|document&limit=20&offset=0
export const getChatMedia = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const conversationId = Number(req.params.id);
    const userId = Number(req?.user?.userId);
    const { type, limit = 20, offset = 0 } = req.query || {};
    if (!conversationId) return res.status(400).json({ message: "Invalid conversation id" });

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!participant || participant.isDeleted) return res.status(403).json({ message: "Not a participant" });

    const whereMsg = {
      conversationId,
      OR: [
        { type: "image" },
        { type: "video" },
        { type: "document" },
        { type: "audio" },
        { mediaFiles: { some: {} } }
      ]
    };
    if (type) {
      const typeStr = String(type);
      whereMsg.OR = [
        { type: typeStr },
        { mediaFiles: { some: { mimeType: { startsWith: `${typeStr}/`, mode: 'insensitive' } } } }
      ];
    }

    const mediaMessages = await prisma.message.findMany({
      where: whereMsg,
      orderBy: { createdAt: "desc" },
      take: Number(limit) || 20,
      skip: Number(offset) || 0,
      include: { mediaFiles: true },
    });

    const items = MediaMapper.mapMediaMessages(mediaMessages);

    return res.status(200).json({ items, count: items.length });
  } catch (error) {
    next(error);
  }
};

// GET /api/chats/:id/media/search
export const searchChatMedia = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const conversationId = Number(req.params.id);
    const userId = Number(req?.user?.userId);
    if (!conversationId) return res.status(400).json({ message: "Invalid conversation id" });

    // Validate participant
    const participant = await prisma.conversationParticipant.findFirst({ where: { conversationId, userId } });
    if (!participant) return res.status(403).json({ message: "Forbidden" });

    // Parse and validate query params
    const {
      type,
      startDate,
      endDate,
      minSize,
      maxSize,
      mimeType,
      page = 1,
      pageSize = 20,
    } = req.query || {};

    const allowedTypes = new Set(["image", "video", "audio", "document"]);
    if (type && !allowedTypes.has(String(type))) {
      return res.status(400).json({ message: "Invalid type" });
    }

    let start = undefined;
    let end = undefined;
    if (startDate) {
      const d = new Date(String(startDate));
      if (isNaN(d.getTime())) return res.status(400).json({ message: "Invalid startDate" });
      start = d;
    }
    if (endDate) {
      const d = new Date(String(endDate));
      if (isNaN(d.getTime())) return res.status(400).json({ message: "Invalid endDate" });
      end = d;
    }
    const minBytes = minSize != null ? Number(minSize) : undefined;
    const maxBytes = maxSize != null ? Number(maxSize) : undefined;
    if (minBytes != null && (isNaN(minBytes) || minBytes < 0)) return res.status(400).json({ message: "Invalid minSize" });
    if (maxBytes != null && (isNaN(maxBytes) || maxBytes < 0)) return res.status(400).json({ message: "Invalid maxSize" });
    const pageNum = Number(page) || 1;
    const sizeNum = Number(pageSize) || 20;
    if (pageNum < 1 || sizeNum < 1 || sizeNum > 100) return res.status(400).json({ message: "Invalid pagination" });

    // Build where directly against Message since MediaFile might be missing for legacy messages
    const messageWhere = {
      conversationId,
      ...(start || end ? { createdAt: { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) } } : {}),
      OR: [
        { type: "image" },
        { type: "video" },
        { type: "document" },
        { type: "audio" },
        { mediaFiles: { some: {} } }
      ]
    };

    if (type) {
      const typeStr = String(type);
      messageWhere.OR = [
        { type: typeStr },
        { mediaFiles: { some: { mimeType: { startsWith: `${typeStr}/`, mode: 'insensitive' } } } }
      ];
    }

    if (mimeType) {
      if (messageWhere.OR) {
        messageWhere.OR.push({ mediaFiles: { some: { mimeType: { contains: String(mimeType), mode: 'insensitive' } } } });
      } else {
        messageWhere.OR = [{ mediaFiles: { some: { mimeType: { contains: String(mimeType), mode: 'insensitive' } } } }];
      }
    }

    const totalCount = await prisma.message.count({ where: messageWhere });
    const totalPages = Math.ceil(totalCount / sizeNum) || 1;
    const skip = (pageNum - 1) * sizeNum;

    const messages = await prisma.message.findMany({
      where: messageWhere,
      orderBy: { createdAt: 'desc' },
      skip,
      take: sizeNum,
      include: { mediaFiles: true },
    });

    const mediaItems = MediaMapper.mapMediaMessages(messages);

    return res.status(200).json({
      totalCount,
      currentPage: pageNum,
      totalPages,
      pageSize: sizeNum,
      mediaItems,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/media/:mediaId/download
export const downloadMedia = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const mediaId = Number(req.params.mediaId);
    const userId = Number(req?.user?.userId);
    if (!mediaId) return res.status(400).json({ message: "Invalid media id" });

    const media = await prisma.mediaFile.findUnique({
      where: { id: mediaId },
      include: { message: { include: { conversation: { include: { participants: true } } } } },
    });

    // If no formal MediaFile is found, check if it's a legacy Message that holds the Cloudinary ID natively
    if (!media) {
      const message = await prisma.message.findUnique({
        where: { id: mediaId },
        include: { conversation: { include: { participants: true } } }
      });

      if (!message || !message.content) {
        return res.status(404).json({ message: "Media not found" });
      }

      const isParticipant = message.conversation.participants.some((p) => p.userId === userId);
      if (!isParticipant) return res.status(403).json({ message: "Forbidden" });

      const url = message.content.startsWith('http')
        ? message.content
        : buildCloudinaryDownloadUrl(message.content, {
          resource_type: "auto",
          fileNameOverride: message.fileName || message.caption || undefined,
        });

      return res.status(200).json({ url });
    }

    const isParticipant = media.message.conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) return res.status(403).json({ message: "Forbidden" });

    // Optional: increment download counter
    try {
      await prisma.mediaFile.update({ where: { id: mediaId }, data: { downloadCount: (media.downloadCount || 0) + 1 } });
    } catch (_) { }

    const url = buildCloudinaryDownloadUrl(media.cloudinaryPublicId, {
      resource_type: media.cloudinaryResourceType || "auto",
      fileNameOverride: media.originalName || undefined,
    });

    return res.status(200).json({ url });
  } catch (error) {
    next(error);
  }
};

// GET /api/messages/media/proxy?url=<cloudinary_url>&filename=<name>
export const proxyDownload = async (req, res, next) => {
  try {
    const targetUrl = req.query.url;
    const fileName = req.query.filename || "download";

    if (!targetUrl || !targetUrl.startsWith("http")) {
      return res.status(400).send("Invalid URL provided for proxy download.");
    }

    // Server-side fetch bypasses CORS preflights
    const response = await fetch(targetUrl);

    if (!response.ok) {
      return res.status(response.status).send("Failed to proxy media from upstream server.");
    }

    // Manually pass Cloudinary headers, but force it as an attachment
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    res.setHeader("Content-Type", contentType);

    // Force browser to native-download instead of opening in a new tab
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);

    // Stream the readable response payload directly to the Express response to save RAM
    if (response.body) {
      // Node.js 18+ web stream compatibility with Express
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } else {
      // Fallback
      const arrayBuffer = await response.arrayBuffer();
      res.end(Buffer.from(arrayBuffer));
    }
  } catch (error) {
    console.error("Proxy Download Error:", error);
    res.status(500).send("Internal Server Error during file proxying.");
  }
};
