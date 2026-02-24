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
