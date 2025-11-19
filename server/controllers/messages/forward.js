import getPrismaInstance from "../../utils/PrismaClient.js";

export const forwardMessages = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const requesterId = Number(req?.user?.userId);
    const { messageIds, toConversationIds } = req.body || {};

    if (!Array.isArray(messageIds) || !messageIds.length || messageIds.length > 5) {
      return res.status(400).json({ message: "messageIds must be an array of 1..5 ids" });
    }
    if (!Array.isArray(toConversationIds) || !toConversationIds.length || toConversationIds.length > 5) {
      return res.status(400).json({ message: "toConversationIds must be an array of 1..5 ids" });
    }

    // Load source messages with conversations and media
    const msgs = await prisma.message.findMany({
      where: { id: { in: messageIds.map(Number) } },
      include: {
        conversation: { include: { participants: true } },
        mediaFiles: true,
      },
    });
    if (msgs.length !== messageIds.length) {
      return res.status(404).json({ message: "One or more messages not found" });
    }

    // Permission: requester must be participant in all source conversations
    for (const m of msgs) {
      const isParticipant = m.conversation.participants.some(p => p.userId === requesterId);
      if (!isParticipant) {
        return res.status(403).json({ message: `No access to source message ${m.id}` });
      }
    }

    // Load destination conversations and validate access
    const destConvos = await prisma.conversation.findMany({
      where: { id: { in: toConversationIds.map(Number) } },
      include: { participants: true },
    });
    if (destConvos.length !== toConversationIds.length) {
      return res.status(404).json({ message: "One or more destination conversations not found" });
    }
    for (const c of destConvos) {
      const isParticipant = c.participants.some(p => p.userId === requesterId);
      if (!isParticipant) {
        return res.status(403).json({ message: `No access to destination conversation ${c.id}` });
      }
    }

    const created = [];

    // For each message and each destination, create forwarded message and duplicate media rows
    for (const m of msgs) {
      for (const c of destConvos) {
        const newMsg = await prisma.message.create({
          data: {
            conversationId: c.id,
            senderId: requesterId,
            type: m.type,
            content: m.content,
            caption: m.caption,
            fileName: m.fileName,
            fileSize: m.fileSize,
            mimeType: m.mimeType,
            duration: m.duration,
            thumbnailUrl: m.thumbnailUrl,
            status: "sent",
            isForwarded: true,
            originalMessageId: m.id,
            forwardCount: (m.forwardCount || 0) + 1,
          },
        });

        // Duplicate media metadata if any
        if (m.mediaFiles && m.mediaFiles.length) {
          for (const mf of m.mediaFiles) {
            await prisma.mediaFile.create({
              data: {
                messageId: newMsg.id,
                storageKey: mf.storageKey,
                storageProvider: mf.storageProvider,
                originalName: mf.originalName,
                mimeType: mf.mimeType,
                fileSize: mf.fileSize,
                width: mf.width,
                height: mf.height,
                duration: mf.duration,
                thumbnailKey: mf.thumbnailKey,
                thumbnailSize: mf.thumbnailSize,
                uploadStatus: mf.uploadStatus,
                downloadCount: 0,
                isCompressed: mf.isCompressed,
                originalFileSize: mf.originalFileSize,
                expiresAt: mf.expiresAt,
                cloudinaryPublicId: mf.cloudinaryPublicId,
                cloudinaryVersion: mf.cloudinaryVersion,
                cloudinaryResourceType: mf.cloudinaryResourceType,
                cloudinaryFormat: mf.cloudinaryFormat,
                cloudinaryFolder: mf.cloudinaryFolder,
                cloudinaryAssetId: mf.cloudinaryAssetId,
              },
            });
          }
        }

        created.push({ ...newMsg, conversationId: c.id });

        // Emit to destination participants
        try {
          if (global?.io && global?.onlineUsers) {
            c.participants.forEach((p) => {
              const sid = global.onlineUsers.get(String(p.userId)) || global.onlineUsers.get(p.userId);
              if (sid) global.io.to(sid).emit("message-forwarded", { message: newMsg, conversationId: c.id });
            });
          }
        } catch (_) {}
      }
    }

    return res.status(201).json({ messages: created });
  } catch (error) {
    next(error);
  }
};
