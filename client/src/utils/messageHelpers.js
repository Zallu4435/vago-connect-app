/**
 * Normalizes an incoming raw message object into a consistent shape used across the frontend.
 *  
 * @param {Object} raw - The raw message payload from API or socket
 * @param {string|number} fromId - The sender ID
 * @param {string|number} toId - The receiver/group ID
 * @param {string} fallbackType - Type fallback (e.g., "text", "image")
 * @returns {Object} Normalized message object
 */
export const normalizeMessage = (raw, fromId, toId, fallbackType = "text") => ({
    id: Number(raw?.id),
    conversationId: Number(raw?.conversationId || 0),
    senderId: Number(fromId),
    receiverId: Number(toId),
    type: raw?.type || fallbackType,
    content: String(raw?.content ?? ""),
    message: String(raw?.content ?? ""),
    messageStatus: (raw?.status || "sent"),
    status: (raw?.status || "sent"),
    createdAt: String(raw?.createdAt || new Date().toISOString()),
    timestamp: String(raw?.createdAt || new Date().toISOString()),
    isEdited: Boolean(raw?.isEdited),
    editedAt: raw?.editedAt || undefined,
    reactions: Array.isArray(raw?.reactions) ? raw.reactions : [],
    starredBy: Array.isArray(raw?.starredBy) ? raw.starredBy : [],
    caption: typeof raw?.caption === 'string' ? raw.caption : undefined,
    replyToMessageId: raw?.replyToMessageId,
    quotedMessage: raw?.quotedMessage,
});

/**
 * Formats bytes into a human-readable size string.
 *
 * @param {number} bytes 
 * @returns {string} Formatted size (e.g., "1.5 MB")
 */
export const formatBytes = (bytes) => {
    if (!bytes) return "";
    const k = 1024, sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
};
