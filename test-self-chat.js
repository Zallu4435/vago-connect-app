import { MessageService } from "./server/services/MessageService.js";
import getPrismaInstance from "./server/utils/PrismaClient.js";

async function test() {
  const prisma = getPrismaInstance();
  const user = await prisma.user.findFirst();
  console.log("Testing self chat for user", user.id);
  
  try {
    const result = await MessageService.addMessage({
      content: "Test message",
      from: user.id,
      to: user.id,
      type: "text",
      isGroup: false,
      recipientOnline: false
    });
    console.log("Success:", result.message.id);
  } catch (e) {
    console.error("Error occurred:", e);
  }
}
test().then(() => process.exit(0));
