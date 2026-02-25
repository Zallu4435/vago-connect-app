import { CallService } from "../../services/CallService.js";

export function handleCallEvents(io, socket, onlineUsers) {
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
            const { message, conversation } = await CallService.createCallMessage(fromId, toId, payload.callType);
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
                    const updated = await CallService.updateCallMessage(callMessageId, { status: "missed", duration: 0 });
                    if (updated) CallService.emitCallMessageUpdate(updated, participantIds);
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
                const updated = await CallService.updateCallMessage(payload.callMessageId, { status: "rejected", duration: 0 });
                if (updated) {
                    const ids = [Number(payload.from), Number(payload.to)].filter(Boolean);
                    CallService.emitCallMessageUpdate(updated, ids);
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
                const updated = await CallService.updateCallMessage(payload.callMessageId, { status, duration: dur });
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
        const peerSocket = onlineUsers.get(String(payload?.to));
        if (peerSocket) socket.to(peerSocket).emit("webrtc-offer", { offer: payload.offer, from: payload.from });
    });

    socket.on("webrtc-answer", (payload) => {
        const peerSocket = onlineUsers.get(String(payload?.to));
        if (peerSocket) socket.to(peerSocket).emit("webrtc-answer", { answer: payload.answer, from: payload.from });
    });

    socket.on("webrtc-ice-candidate", (payload) => {
        const peerSocket = onlineUsers.get(String(payload?.to));
        if (peerSocket) socket.to(peerSocket).emit("webrtc-ice-candidate", { candidate: payload.candidate, from: payload.from });
    });

    socket.on("call-media-state", (payload) => {
        const peerSocket = onlineUsers.get(String(payload?.to));
        if (peerSocket) socket.to(peerSocket).emit("call-media-state", payload);
    });
}
