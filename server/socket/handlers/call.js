import { CallService } from "../../services/CallService.js";
import { isBlockedBetweenUsers } from "../../utils/messageHelpers.js";
import getPrismaInstance from "../../utils/PrismaClient.js";

export function handleCallEvents(io, socket, onlineUsers) {
    socket.on("call-user", async (payload) => {
        // payload: { callType, from: {id,name,image}, to: {id,name,image} }
        const toId = payload?.to?.id ?? payload?.to;
        const fromId = payload?.from?.id ?? payload?.from;

        if (String(fromId) === String(toId)) {
            socket.emit("call-failed", { reason: "self-call" });
            return;
        }

        const isCalleeOnline = onlineUsers.has(String(toId));

        // Block check
        try {
            const blocked = await isBlockedBetweenUsers(getPrismaInstance(), fromId, toId);
            if (blocked) {
                socket.emit("call-failed", { reason: "blocked" });
                return;
            }
        } catch (err) {
            console.error("Call block check failed", err);
        }

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
            io.to(String(fromId)).emit("message-sent", { message: callMsg });
            // Emit to callee if online (so the call appears in their chat too)
            if (isCalleeOnline) io.to(String(toId)).emit("message-sent", { message: callMsg });
        } catch (err) {
            console.error("[call-user] Failed to create call message:", err);
        }

        if (isCalleeOnline) {
            // Callee is online — relay incoming-call with the DB message id
            socket.to(String(toId)).emit("incoming-call", { ...payload, callMessageId });
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
        if (payload?.from) socket.to(String(payload.from)).emit("call-accepted");
    });

    socket.on("reject-call", async (payload) => {
        if (payload?.from) socket.to(String(payload.from)).emit("call-rejected");

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
        if (payload?.to) socket.to(String(payload.to)).emit("call-ended");

        // Update DB: ended vs missed (duration=0 means caller cancelled before answer)
        if (payload?.callMessageId) {
            const dur = Number(payload?.duration ?? 0);
            const status = dur > 0 ? "ended" : "missed";
            try {
                const updated = await CallService.updateCallMessage(payload.callMessageId, { status, duration: dur });
                if (updated) {
                    // emit to caller and callee
                    io.to(String(socket.userId || payload.from)).emit("message-sent", { message: updated });
                    if (payload?.to) io.to(String(payload.to)).emit("message-sent", { message: updated });
                }
            } catch (_) { }
        }
    });

    // ── WebRTC SDP + ICE relay (server is a pure relay; no SDP inspection) ──
    socket.on("webrtc-offer", (payload) => {
        if (payload?.to) socket.to(String(payload.to)).emit("webrtc-offer", { offer: payload.offer, from: payload.from });
    });

    socket.on("webrtc-answer", (payload) => {
        if (payload?.to) socket.to(String(payload.to)).emit("webrtc-answer", { answer: payload.answer, from: payload.from });
    });

    socket.on("webrtc-ice-candidate", (payload) => {
        if (payload?.to) socket.to(String(payload.to)).emit("webrtc-ice-candidate", { candidate: payload.candidate, from: payload.from });
    });

    socket.on("call-media-state", (payload) => {
        if (payload?.to) socket.to(String(payload.to)).emit("call-media-state", payload);
    });
}
