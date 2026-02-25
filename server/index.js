import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import AuthRoutes from "./routes/AuthRoutes.js";
import MessageRoutes from "./routes/MessageRoutes.js";
import UserRoutes from "./routes/UserRoutes.js";
import { Server } from "socket.io";
import http from "http";
import { createCallMessage, updateCallMessage, emitCallMessageUpdate } from "./controllers/messages/call.js";

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

  // ── Call signaling ────────────────────────────────────────────────
  socket.on("call-user", async (payload) => {
    // payload: { callType, from: {id,name,image}, to: {id,name,image} }
    const toId = payload?.to?.id ?? payload?.to;
    const fromId = payload?.from?.id ?? payload?.from;
    const toSocket = onlineUsers.get(String(toId));

    // Persist the call record immediately (works even if callee is offline)
    let callMessageId = null;
    let callMsg = null;
    let participantIds = [];
    try {
      const { message, conversation } = await createCallMessage(fromId, toId, payload.callType);
      callMessageId = message.id;
      callMsg = message;
      participantIds = conversation.participants.map((p) => p.userId);

      // Emit call message to the caller immediately (they see "Voice call" in chat)
      const callerSocket = onlineUsers.get(String(fromId));
      if (callerSocket) io.to(callerSocket).emit("message-sent", { message: callMsg });
      // Emit to callee if online (so the call appears in their chat too)
      if (toSocket) io.to(toSocket).emit("message-sent", { message: callMsg });
    } catch (err) {
      console.error("[call-user] Failed to create call message:", err);
    }

    if (toSocket) {
      // Callee is online — relay incoming-call with the DB message id
      socket.to(toSocket).emit("incoming-call", { ...payload, callMessageId });
    } else {
      // Callee offline — immediately mark as missed
      if (callMessageId) {
        try {
          const updated = await updateCallMessage(callMessageId, { status: "missed", duration: 0 });
          if (updated) emitCallMessageUpdate(updated, participantIds);
        } catch (_) { }
      }
      socket.emit("call-failed", { reason: "offline" });
    }
  });

  socket.on("accept-call", (payload) => {
    // payload: { from: callerId, to: calleeId }
    const callerSocket = onlineUsers.get(String(payload?.from));
    if (callerSocket) socket.to(callerSocket).emit("call-accepted");
  });

  socket.on("reject-call", async (payload) => {
    // payload: { from: callerId, to: calleeId, callMessageId }
    const callerSocket = onlineUsers.get(String(payload?.from));
    if (callerSocket) socket.to(callerSocket).emit("call-rejected");

    // Update DB + emit updated message to both parties
    if (payload?.callMessageId) {
      try {
        const updated = await updateCallMessage(payload.callMessageId, { status: "rejected", duration: 0 });
        if (updated) {
          const ids = [Number(payload.from), Number(payload.to)].filter(Boolean);
          emitCallMessageUpdate(updated, ids);
        }
      } catch (_) { }
    }
  });

  socket.on("end-call", async (payload) => {
    // payload: { to: otherUserId, callMessageId, duration (seconds) }
    const peerSocket = onlineUsers.get(String(payload?.to));
    if (peerSocket) socket.to(peerSocket).emit("call-ended");

    // Update DB: ended vs missed (duration=0 means caller cancelled before answer)
    if (payload?.callMessageId) {
      const dur = Number(payload?.duration ?? 0);
      const status = dur > 0 ? "ended" : "missed";
      try {
        const updated = await updateCallMessage(payload.callMessageId, { status, duration: dur });
        if (updated) {
          // from is not directly in end-call payload, fetch participants from message
          // emit to caller (self) + callee
          const callerSid = socket.id;
          io.to(callerSid).emit("message-sent", { message: updated });
          if (peerSocket) io.to(peerSocket).emit("message-sent", { message: updated });
        }
      } catch (_) { }
    }
  });

  // ── WebRTC SDP + ICE relay (server is a pure relay; no SDP inspection) ──
  socket.on("webrtc-offer", (payload) => {
    // payload: { to: userId, offer: RTCSessionDescriptionInit }
    const peerSocket = onlineUsers.get(String(payload?.to));
    if (peerSocket) socket.to(peerSocket).emit("webrtc-offer", { offer: payload.offer, from: payload.from });
  });

  socket.on("webrtc-answer", (payload) => {
    // payload: { to: userId, answer: RTCSessionDescriptionInit }
    const peerSocket = onlineUsers.get(String(payload?.to));
    if (peerSocket) socket.to(peerSocket).emit("webrtc-answer", { answer: payload.answer, from: payload.from });
  });

  socket.on("webrtc-ice-candidate", (payload) => {
    // payload: { to: userId, candidate: RTCIceCandidateInit }
    const peerSocket = onlineUsers.get(String(payload?.to));
    if (peerSocket) socket.to(peerSocket).emit("webrtc-ice-candidate", { candidate: payload.candidate, from: payload.from });
  });

  socket.on("call-media-state", (payload) => {
    // payload: { to: userId, muted?: boolean, cameraOff?: boolean }
    const peerSocket = onlineUsers.get(String(payload?.to));
    if (peerSocket) socket.to(peerSocket).emit("call-media-state", payload);
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