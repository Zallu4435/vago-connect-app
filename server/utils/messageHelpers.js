export async function getOrCreateDirectConversation(prisma, userAId, userBId) {
  const a = Number(userAId);
  const b = Number(userBId);
  let convoList = await prisma.conversation.findMany({
    where: {
      type: "direct",
      participants: { some: { userId: a } },
      AND: [{ participants: { some: { userId: b } } }],
    },
    include: { participants: true },
  });

  // Filter for exact match to prevent a===b returning chats with c
  let convo = convoList.find(c => {
    if (a === b) return c.participants.length === 1 && c.participants[0].userId === a;
    return c.participants.length === 2 && c.participants.some(p => p.userId === a) && c.participants.some(p => p.userId === b);
  });
  if (!convo) {
    // Create the conversation first to avoid nested participant unique conflicts
    const created = await prisma.conversation.create({
      data: { type: "direct" },
    });

    // Build unique user list (handle self-chat gracefully)
    const userIds = a === b ? [a] : [a, b];
    await prisma.conversationParticipant.createMany({
      data: userIds.map((uid) => ({ conversationId: created.id, userId: uid })),
      skipDuplicates: true,
    });

    convo = await prisma.conversation.findUnique({
      where: { id: created.id },
      include: { participants: true },
    });
  }
  return convo;
}

export async function resolveConversation(prisma, from, to, isGroup) {
  if (isGroup === true || isGroup === 'true') {
    const convo = await prisma.conversation.findUnique({
      where: { id: Number(to) },
      include: { participants: true },
    });
    if (!convo || convo.type !== 'group') throw new Error("Group not found");
    return convo;
  }
  return await getOrCreateDirectConversation(prisma, from, to);
}

export async function isBlockedBetweenUsers(prisma, userAId, userBId) {
  const a = Number(userAId);
  const b = Number(userBId);
  const blocked = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
  });
  return Boolean(blocked);
}

export async function unhideConversationParticipants(prisma, conversationId) {
  await prisma.conversationParticipant.updateMany({
    where: {
      conversationId: Number(conversationId),
      isDeleted: true,
    },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });
}

export function buildMediaFileData(messageId, cld, file, extra = {}) {
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

export async function prepareReply(prisma, convoId, replyToMessageId, requesterId) {
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
