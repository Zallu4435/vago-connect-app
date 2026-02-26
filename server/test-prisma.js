import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findFirst();
  console.log("Found user:", user.id);
  
  const a = user.id;
  const b = user.id;
  
  let convoList = await prisma.conversation.findMany({
    where: {
      type: "direct",
      participants: { some: { userId: a } },
      AND: [{ participants: { some: { userId: b } } }],
    },
    include: { participants: true },
  });

  let convo = convoList.find(c => {
    if (a === b) return c.participants.length === 1 && c.participants[0].userId === a;
    return c.participants.length === 2 && c.participants.some(p => p.userId === a) && c.participants.some(p => p.userId === b);
  });
  
  if (!convo) {
    console.log("No self-convo. Trying to create...");
    try {
        const created = await prisma.conversation.create({ data: { type: "direct" } });
        await prisma.conversationParticipant.createMany({
          data: [{ conversationId: created.id, userId: a }],
          skipDuplicates: true,
        });
        console.log("Created self chat convo", created.id);
    } catch(e) {
        console.error("Failed to create", e);
    }
  } else {
    console.log("Self convo exists:", convo.id);
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
