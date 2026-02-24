import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, name: true } });
  console.log("Users:", users);

  const messages = await prisma.message.findMany({
    take: 5,
    orderBy: { id: 'desc' },
    select: {
      id: true,
      content: true,
      isForwarded: true,
      quotedMessage: true,
      replyToMessageId: true
    }
  });
  console.log("Last 5 messages:", JSON.stringify(messages, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
