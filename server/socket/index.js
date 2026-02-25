import { Server } from "socket.io";
import { handleChatEvents } from "./handlers/chat.js";
import { handleCallEvents } from "./handlers/call.js";

// Initialize onlineUsers if not already
global.onlineUsers = global.onlineUsers || new Map();

/**
 * Initialize Socket.IO server
 * @param {import('http').Server} httpServer
 */
export function initializeSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:3000",
        },
    });

    global.io = io;

    io.on("connection", (socket) => {
        global.chatSocket = socket;

        // Register event handlers
        handleChatEvents(io, socket, global.onlineUsers);
        handleCallEvents(io, socket, global.onlineUsers);
    });

    return io;
}
