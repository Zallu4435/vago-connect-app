/**
 * Groups a linear array of messages into clusters (bubbles) by the same sender,
 * within a 10-minute window, treating system messages and status updates separately.
 * 
 * @param {Array} messages - The raw array of messages to cluster
 * @returns {Array} An array of message clusters
 */
export const clusterMessages = (messagesArr) => {
    if (!messagesArr || messagesArr.length === 0) return [];
    const clusters = [];
    let currentCluster = [];
    let currentSender = messagesArr[0]?.senderId;
    let currentType = messagesArr[0]?.type;
    let lastMessageTime = new Date(messagesArr[0]?.createdAt).getTime();

    const isSystemLike = (msg) => msg?.type === "system" || msg?.type === "group_status";

    for (const msg of messagesArr) {
        if (!msg) continue;
        const msgTime = new Date(msg.createdAt).getTime();
        const timeDiff = (msgTime - lastMessageTime) / (1000 * 60); // minutes
        const isSameSender = msg.senderId === currentSender;
        const msgIsSystem = isSystemLike(msg);
        const currClusterIsSystem = currentCluster.length > 0 && isSystemLike(currentCluster[0]);

        if (
            isSameSender &&
            timeDiff <= 10 &&
            msgIsSystem === currClusterIsSystem &&
            !(msgIsSystem && msg.type !== currentType)
        ) {
            currentCluster.push(msg);
        } else {
            if (currentCluster.length > 0) {
                clusters.push({
                    senderId: currentSender,
                    messages: currentCluster,
                    isSystem: currClusterIsSystem,
                    type: currClusterIsSystem ? currentType : "user",
                });
            }
            currentCluster = [msg];
            currentSender = msg.senderId;
            currentType = msg.type;
        }
        lastMessageTime = msgTime;
    }

    if (currentCluster.length > 0) {
        clusters.push({
            senderId: currentSender,
            messages: currentCluster,
            isSystem: isSystemLike(currentCluster[0]),
            type: isSystemLike(currentCluster[0]) ? currentType : "user",
        });
    }
    return clusters;
};

/**
 * Returns the correct avatar URL prioritizing group profile images.
 * 
 * @param {Object} currentChatUser - The active chat target
 * @param {Object} userInfo - The authenticated user's metadata
 * @param {boolean} isSelfChat - Whether this is a saved messages chat
 * @returns {string} The resolved avatar path
 */
export const getAvatarUrl = (currentChatUser, userInfo, isSelfChat) => {
    if (isSelfChat) return userInfo?.profileImage || "/default_avatar.png";
    if (currentChatUser?.isGroup) {
        return currentChatUser.profileImage || currentChatUser.groupImage || "/default_avatar.png";
    }
    return currentChatUser?.profileImage || "/default_avatar.png";
};
