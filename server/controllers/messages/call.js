/**
 * call.js — server-side helpers for persisting call records as messages
 *
 * Call messages use type='call' with a JSON-serialized content string:
 *   { callType: "audio"|"video", status: "initiated"|"missed"|"rejected"|"ended", duration: 0 }
 *
 * duration is in seconds; 0 means call never connected.
 */
import getPrismaInstance from "../../utils/PrismaClient.js";
import { getOrCreateDirectConversation } from "./helpers.js";

/**
 * Create a call message at call initiation.
 * Returns { message, conversation } so the caller can hold the messageId.
 */
export async function createCallMessage(fromId, toId, callType) {
    const prisma = getPrismaInstance();
    const from = Number(fromId);
    const to = Number(toId);

    const convo = await getOrCreateDirectConversation(prisma, from, to);

    const content = JSON.stringify({ callType, status: "initiated", duration: 0 });

    const message = await prisma.message.create({
        data: {
            conversationId: convo.id,
            senderId: from,
            type: "call",
            content,
            isSystemMessage: true,
            status: "sent",
        },
        include: {
            sender: { select: { id: true, name: true, profileImage: true } },
        },
    });

    return { message, conversation: convo };
}

/**
 * Update a call message status/duration.
 * patch: { status, duration? }
 */
export async function updateCallMessage(messageId, patch) {
    const prisma = getPrismaInstance();
    const id = Number(messageId);
    if (!id) return null;

    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing) return null;

    let meta = {};
    try { meta = JSON.parse(existing.content || "{}"); } catch { }

    const newContent = JSON.stringify({
        ...meta,
        ...patch,
    });

    const updated = await prisma.message.update({
        where: { id },
        data: {
            content: newContent,
            ...(patch.duration != null ? { duration: Math.round(patch.duration) } : {}),
        },
        include: {
            sender: { select: { id: true, name: true, profileImage: true } },
        },
    });

    return updated;
}

/**
 * Emit updated call message to all online conversation participants.
 */
export function emitCallMessageUpdate(message, participantUserIds) {
    try {
        if (!global?.io || !global?.onlineUsers) return;
        participantUserIds.forEach((uid) => {
            const sid = global.onlineUsers.get(String(uid));
            if (sid) {
                global.io.to(sid).emit("message-sent", { message });
            }
        });
    } catch (_) { }
}
