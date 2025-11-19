import getPrismaInstance from "../utils/PrismaClient.js";


export const addMessage = async (req, res, next) => {
    try {
        const prisma = getPrismaInstance();
        const { content, from, to, type = "text" } = req.body;
        const recipientOnline = global.onlineUsers?.get?.(to);

        if (!content || !from || !to) {
            return res.status(400).json({ message: "Invalid data" });
        }

        const newMessage = await prisma.message.create({
            data: {
                content,
                senderId: parseInt(from),
                receiverId: parseInt(to),
                type,
                messageStatus: recipientOnline ? "delivered" : "sent",
            },
        });
        return res.status(201).json(newMessage);
    } catch (error) {
        next(error);
    }
};

export const addImage = async (req, res, next) => {
    try {
        const prisma = getPrismaInstance();
        const { from, to } = req.body;
        if (!req.file || !from || !to) {
            return res.status(400).json({ message: "Invalid data" });
        }
        const recipientOnline = global.onlineUsers?.get?.(to);
        const serverUrl = `${req.protocol}://${req.get('host')}`;
        const contentUrl = `${serverUrl}/upload/images/${req.file.filename}`;
        const newMessage = await prisma.message.create({
            data: {
                content: contentUrl,
                senderId: parseInt(from),
                receiverId: parseInt(to),
                type: "image",
                messageStatus: recipientOnline ? "delivered" : "sent",
            },
        });
        return res.status(201).json(newMessage);
    } catch (error) {
        next(error);
    }
};

export const addAudio = async (req, res, next) => {
    try {
        const prisma = getPrismaInstance();
        const { from, to } = req.body;
        if (!req.file || !from || !to) {
            return res.status(400).json({ message: "Invalid data" });
        }
        const recipientOnline = global.onlineUsers?.get?.(to);
        const serverUrl = `${req.protocol}://${req.get('host')}`;
        const contentUrl = `${serverUrl}/upload/recordings/${req.file.filename}`;
        const newMessage = await prisma.message.create({
            data: {
                content: contentUrl,
                senderId: parseInt(from),
                receiverId: parseInt(to),
                type: "audio",
                messageStatus: recipientOnline ? "delivered" : "sent",
            },
        });
        return res.status(201).json(newMessage);
    } catch (error) {
        next(error);
    }
};

export const getMessages = async (req, res, next) => {
    try {
        const prisma = getPrismaInstance();
        const { from, to } = req.params;

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: parseInt(from), receiverId: parseInt(to) },
                    { senderId: parseInt(to), receiverId: parseInt(from) }
                ]
            },
            orderBy: { timestamp: 'asc' }
        });
        
        const unreadMessages = [];
        messages.forEach((message, index) => {
            if (message.senderId === parseInt(to) && message.messageStatus !== "read") {
                messages[index].messageStatus = "read";
                unreadMessages.push(message.id)
            }
        });

        await prisma.message.updateMany({
            where: {
                id: { in: unreadMessages }
            },
            data: {
                messageStatus: "read"
            }
        });
        
        return res.status(200).json({ messages, unreadMessages }); 
    } catch (error) {
        next(error);
    }
}

export const getInitialContactswithMessages = async (req, res, next) => {
    try {
        // Route is /get-initial-contacts/:from
        const { from } = req.params;
        const userId = parseInt(from);
        const prisma = getPrismaInstance();
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                sentMessages: {
                    include: {
                        receiver: true,
                        sender: true
                    },
                    orderBy: {
                        timestamp: 'asc'
                    },
                },
                receivedMessages: {
                    include: {
                        receiver: true,
                        sender: true
                    },
                    orderBy: {
                        timestamp: 'asc'
                    }
                }
            }
        });

        const messages = [...user.sentMessages, ...user.receivedMessages]

        messages.sort((a, b) => b.timestamp - a.timestamp)

        const users = new Map();
        const messageStatusChange = [];

        messages.forEach((msg) => {
            const isSender = msg.senderId === userId;
            const calculatedId = isSender ? msg.receiverId : msg.senderId;
            
            if (msg.messageStatus === "sent") {
                messageStatusChange.push(msg.id);
            }

            if (!users.get(calculatedId)) {
                const {
                    id,
                    content,
                    timestamp,
                    messageStatus,
                    senderId,
                    receiverId,
                    type
                } = msg;
                let u = {
                    messageId: id,
                    type,
                    message: content,
                    messageStatus,
                    timestamp,
                    senderId,
                    receiverId
                }
                if (isSender) {
                    u = {
                        ...u,
                        ...msg.receiver,
                        totalUnreadMessages: 0
                    }
                } else {
                    u = {
                        ...u,
                        ...msg.sender,
                        totalUnreadMessages: messageStatus !== "read" ? 1 : 0
                    }
                }
                users.set(calculatedId, { ...u })
            } else if (msg.messageStatus !== 'read' && !isSender) {
                const existing = users.get(calculatedId)
                users.set(calculatedId, {
                    ...existing,
                    totalUnreadMessages: (existing?.totalUnreadMessages || 0) + 1
                })
            } 
        });

        if (messageStatusChange.length > 0) {
            await prisma.message.updateMany({
                where: {
                    id: {
                        in: messageStatusChange
                    }
                },
                data: {
                    messageStatus: "delivered"
                }
            })
        }
        
        return res.status(200).json({
            success: true,
            data: Array.from(users.values()),
            onlineUsers: Array.from((global.onlineUsers?.keys?.() || []))
        });
    } catch (error) {
        next(error);
    }
}