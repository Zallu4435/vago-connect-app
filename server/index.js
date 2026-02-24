import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import AuthRoutes from "./routes/AuthRoutes.js";
import MessageRoutes from "./routes/MessageRoutes.js";
import UserRoutes from "./routes/UserRoutes.js";
import { Server } from "socket.io";
import http from "http";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Serve static uploads
app.use("/upload/images", express.static("upload/images"));
app.use("/upload/recordings", express.static("upload/recordings"));

app.use("/api/auth", AuthRoutes);
app.use("/api/messages", MessageRoutes);
app.use("/api/users", UserRoutes);

const port = process.env.PORT || 3005;

// Create HTTP server and pass to Socket.IO
const server = http.createServer(app);
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});
global.io = io;

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.broadcast.emit("user-online", { userId });
    io.emit("online-users", Array.from(onlineUsers.keys()));
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      // Use io.to() instead of socket.to() so it doesn't exclude the sender
      // This is critical for "You" self-chats where to === from.
      io.to(sendUserSocket).emit("msg-recieve", {
        from: data.from,
        message: data.message,
        type: data.type || "text",
        messageId: data.messageId,
        replyToMessageId: data.replyToMessageId,
        quotedMessage: data.quotedMessage,
        caption: data.caption,
      });
    }
  });

  // Call signaling handlers
  socket.on("call-user", (payload) => {
    // payload: { callType, from: {id, name, image}, to: {id, name, image} }
    const toId = payload?.to?.id || payload?.to;
    const toSocket = onlineUsers.get(toId);
    if (toSocket) {
      socket.to(toSocket).emit("incoming-call", payload);
    }
  });

  socket.on("accept-call", (payload) => {
    // payload: { from: callerId, to: calleeId }
    const callerSocket = onlineUsers.get(payload?.from);
    if (callerSocket) {
      socket.to(callerSocket).emit("call-accepted");
    }
  });

  socket.on("reject-call", (payload) => {
    const callerSocket = onlineUsers.get(payload?.from);
    if (callerSocket) {
      socket.to(callerSocket).emit("call-rejected");
    }
  });

  socket.on("end-call", (payload) => {
    // payload: { to: otherUserId }
    const peerSocket = onlineUsers.get(payload?.to);
    if (peerSocket) {
      socket.to(peerSocket).emit("call-ended");
    }
  });

  // Explicit signout: remove mapping and notify others
  socket.on("signout", (userId) => {
    try {
      if (onlineUsers.has(userId)) {
        onlineUsers.delete(userId);
        socket.broadcast.emit("user-offline", { userId });
        io.emit("online-users", Array.from(onlineUsers.keys()));
      }
      // terminate this socket connection
      socket.disconnect(true);
    } catch (_) { }
  });

  socket.on("disconnect", () => {
    // remove socket from onlineUsers map
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(uid);
        socket.broadcast.emit("user-offline", { userId: uid });
        io.emit("online-users", Array.from(onlineUsers.keys()));
        break;
      }
    }
  });
});