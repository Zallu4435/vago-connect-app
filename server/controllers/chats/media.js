import getPrismaInstance from "../../utils/PrismaClient.js";
import { buildCloudinaryUrl, buildCloudinaryDownloadUrl } from "../../utils/Cloudinary.js";

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

    const whereMsg = { conversationId };
    if (type) whereMsg["type"] = String(type);

    const mediaMessages = await prisma.message.findMany({
      where: whereMsg,
      orderBy: { createdAt: "desc" },
      take: Number(limit) || 20,
      skip: Number(offset) || 0,
      include: { mediaFiles: true },
    });

    const items = mediaMessages.flatMap((m) => {
      if (!m.mediaFiles || !m.mediaFiles.length) return [];
      return m.mediaFiles.map((mf) => ({
        mediaId: mf.id,
        messageId: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        type: mf.mimeType || mf.cloudinaryResourceType || m.type,
        url: buildCloudinaryUrl(mf.cloudinaryPublicId, { resource_type: mf.cloudinaryResourceType }),
        thumbnailUrl: mf.thumbnailKey ? buildCloudinaryUrl(mf.thumbnailKey, { resource_type: mf.cloudinaryResourceType }) : m.thumbnailUrl || null,
        mimeType: mf.mimeType,
        fileSize: mf.fileSize,
        width: mf.width,
        height: mf.height,
        duration: mf.duration,
        createdAt: m.createdAt,
        fileName: mf.originalName || m.fileName || null,
      }));
    });

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

    // Build where for MediaFile with join to Message
    const where = {
      message: {
        conversationId,
        ...(start || end ? { createdAt: { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) } } : {}),
        ...(type ? { OR: [ { type: String(type) } ] } : {}),
      },
      ...(minBytes != null || maxBytes != null ? { fileSize: { ...(minBytes != null ? { gte: BigInt(minBytes) } : {}), ...(maxBytes != null ? { lte: BigInt(maxBytes) } : {}) } } : {}),
      ...(mimeType ? { mimeType: { contains: String(mimeType), mode: 'insensitive' } } : {}),
    };

    // If type is provided, also allow filtering by MIME prefix as a fallback (e.g., image/*)
    if (type) {
      where.OR = [
        ...(where.OR || []),
        { mimeType: { startsWith: `${type}/`, mode: 'insensitive' } },
      ];
    }

    // Count first for pagination
    const totalCount = await prisma.mediaFile.count({ where });
    const totalPages = Math.ceil(totalCount / sizeNum) || 1;
    const skip = (pageNum - 1) * sizeNum;

    const mediaFiles = await prisma.mediaFile.findMany({
      where,
      orderBy: { message: { createdAt: 'desc' } },
      skip,
      take: sizeNum,
      include: { message: true },
    });

    const mediaItems = mediaFiles.map((mf) => ({
      mediaId: mf.id,
      messageId: mf.messageId,
      conversationId: mf.message.conversationId,
      senderId: mf.message.senderId,
      type: mf.mimeType || mf.cloudinaryResourceType || mf.message.type,
      url: buildCloudinaryUrl(mf.cloudinaryPublicId, { resource_type: mf.cloudinaryResourceType || 'auto' }),
      thumbnailUrl: mf.thumbnailKey ? buildCloudinaryUrl(mf.thumbnailKey, { resource_type: mf.cloudinaryResourceType || 'image' }) : mf.message.thumbnailUrl || null,
      mimeType: mf.mimeType,
      fileSize: mf.fileSize,
      width: mf.width,
      height: mf.height,
      duration: mf.duration,
      createdAt: mf.message.createdAt,
      fileName: mf.originalName || mf.message.fileName || null,
    }));

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
    if (!media) return res.status(404).json({ message: "Media not found" });

    const isParticipant = media.message.conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) return res.status(403).json({ message: "Forbidden" });

    // Optional: increment download counter
    try {
      await prisma.mediaFile.update({ where: { id: mediaId }, data: { downloadCount: (media.downloadCount || 0) + 1 } });
    } catch (_) {}

    const url = buildCloudinaryDownloadUrl(media.cloudinaryPublicId, {
      resource_type: media.cloudinaryResourceType || "auto",
      fileNameOverride: media.originalName || undefined,
    });

    return res.status(200).json({ url });
  } catch (error) {
    next(error);
  }
};
