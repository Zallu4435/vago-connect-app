"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSocketStore } from "@/stores/socketStore";
import { useCallStore } from "@/stores/callStore";
import { callSession } from '@/hooks/calls/useCallSocketHandlers';

// Public STUN servers — works on localhost and LAN; production needs TURN
const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
    ],
};

/**
 * useWebRTC
 *
 * Manages a single RTCPeerConnection for audio or video calls.
 *
 * @param {object} callData   - {from, to, callType}
 * @param {boolean} isCaller  - true if this user initiated the call
 *
 * Exposes:
 *   localVideoRef, remoteVideoRef
 *   localStream, remoteStream
 *   isMuted, isCameraOff
 *   remoteMuted, remoteCameraOff  — remote user's state
 *   toggleMute(), toggleCamera(), hangUp()
 *   connectionState
 */
export function useWebRTC(callData, isCaller) {
    const socket = useSocketStore((s) => s.socket);
    const endCallStore = useCallStore((s) => s.endCall);

    // ── Stable refs (survive re-renders without becoming stale) ──────────────
    const peerRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const iceCandidateQueue = useRef([]);
    const isSettingRemoteRef = useRef(false);
    const hangUpRef = useRef(null);           // stable ref so onconnectionstatechange never goes stale
    const initialisedRef = useRef(false);     // prevents double initPeer on same mount
    const pendingOfferRef = useRef(null);     // buffer offer that arrives before initPeer completes

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [remoteMuted, setRemoteMuted] = useState(false);
    const [remoteCameraOff, setRemoteCameraOff] = useState(false);
    const [connectionState, setConnectionState] = useState("new");

    // Stable derived values via ref — avoid stale closures inside peer callbacks
    const peerIdRef = useRef(null);
    const myIdRef = useRef(null);
    const isVideoCallRef = useRef(false);

    useEffect(() => {
        peerIdRef.current = isCaller ? callData?.to?.id : callData?.from?.id;
        myIdRef.current = isCaller ? callData?.from?.id : callData?.to?.id;
        isVideoCallRef.current = callData?.callType === "video";
    });

    // ── Cleanup ───────────────────────────────────────────────────────────────
    const cleanup = useCallback(() => {
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        remoteStreamRef.current = null;
        if (peerRef.current) {
            peerRef.current.ontrack = null;
            peerRef.current.onicecandidate = null;
            peerRef.current.onconnectionstatechange = null;
            peerRef.current.close();
            peerRef.current = null;
        }
        initialisedRef.current = false;
        pendingOfferRef.current = null;
        setLocalStream(null);
        setRemoteStream(null);
        setRemoteMuted(false);
        setRemoteCameraOff(false);
        iceCandidateQueue.current = [];
        isSettingRemoteRef.current = false;
    }, []);

    // ── Drain ICE queue after remote description is set ───────────────────────
    const drainICEQueue = useCallback(async () => {
        const pc = peerRef.current;
        if (!pc) return;
        while (iceCandidateQueue.current.length > 0) {
            const candidate = iceCandidateQueue.current.shift();
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch { }
        }
    }, []);

    // ── Create RTCPeerConnection + getUserMedia ───────────────────────────────
    const initPeer = useCallback(async () => {
        if (initialisedRef.current || peerRef.current) return null;
        initialisedRef.current = true;

        const constraints = isVideoCallRef.current
            ? { audio: true, video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } }
            : { audio: true, video: false };

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
            console.error("[WebRTC] getUserMedia failed:", err.name, err.message);
            initialisedRef.current = false;
            return null;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerRef.current = pc;

        // Add local tracks
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // ICE → relay
        pc.onicecandidate = (event) => {
            if (event.candidate && socket?.current) {
                socket.current.emit("webrtc-ice-candidate", {
                    to: String(peerIdRef.current),
                    from: String(myIdRef.current),
                    candidate: event.candidate.toJSON(),
                });
            }
        };

        // Remote tracks
        const remote = new MediaStream();
        remoteStreamRef.current = remote;
        setRemoteStream(remote);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remote;

        pc.ontrack = (event) => {
            event.streams[0]?.getTracks().forEach((track) => {
                // Prevent duplicate tracks
                if (!remote.getTracks().find((t) => t.id === track.id)) {
                    remote.addTrack(track);
                }
            });
            setRemoteStream(new MediaStream(remote.getTracks()));
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remote;
        };

        // Connection state — use stable hangUpRef to avoid staleness
        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            setConnectionState(state);
            if (state === "failed" || state === "disconnected") {
                hangUpRef.current?.();
            }
        };

        return pc;
    }, [socket]); // socket ref is stable

    // ── Caller: create + send offer ───────────────────────────────────────────
    const startCall = useCallback(async () => {
        const pc = await initPeer();
        if (!pc) return;

        const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: isVideoCallRef.current,
        });
        await pc.setLocalDescription(offer);

        socket?.current?.emit("webrtc-offer", {
            to: String(peerIdRef.current),
            from: String(myIdRef.current),
            offer: pc.localDescription,
        });
    }, [initPeer, socket]);

    // ── Callee: set remote desc + answer ──────────────────────────────────────
    const handleOffer = useCallback(async (offer) => {
        // If peer isn't ready yet, buffer the offer
        if (!peerRef.current) {
            pendingOfferRef.current = offer;
            return;
        }
        const pc = peerRef.current;

        isSettingRemoteRef.current = true;
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
        } finally {
            isSettingRemoteRef.current = false;
        }
        await drainICEQueue();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket?.current?.emit("webrtc-answer", {
            to: String(peerIdRef.current),
            from: String(myIdRef.current),
            answer: pc.localDescription,
        });
    }, [drainICEQueue, socket]);

    // ── Caller: set remote answer ─────────────────────────────────────────────
    const handleAnswer = useCallback(async (answer) => {
        const pc = peerRef.current;
        if (!pc || pc.signalingState === "stable") return;

        isSettingRemoteRef.current = true;
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } finally {
            isSettingRemoteRef.current = false;
        }
        await drainICEQueue();
    }, [drainICEQueue]);

    // ── ICE candidate from remote ─────────────────────────────────────────────
    const handleICECandidate = useCallback(async (candidate) => {
        const pc = peerRef.current;
        if (!pc) { iceCandidateQueue.current.push(candidate); return; }

        if (isSettingRemoteRef.current || !pc.remoteDescription) {
            iceCandidateQueue.current.push(candidate);
            return;
        }
        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch { }
    }, []);

    // ── Hang up ───────────────────────────────────────────────────────────────
    const hangUp = useCallback(() => {
        const durationMs = callSession.callStartTime ? Date.now() - callSession.callStartTime : 0;
        const durationSec = Math.round(durationMs / 1000);

        socket?.current?.emit("end-call", {
            to: String(peerIdRef.current),
            callMessageId: callSession.callMessageId ?? undefined,
            duration: durationSec,
        });

        callSession.callMessageId = null;
        callSession.callStartTime = null;

        cleanup();
        endCallStore();
    }, [socket, cleanup, endCallStore]); // note: peerIdRef is a ref, not reactive

    // Keep hangUpRef in sync with latest hangUp so onconnectionstatechange is never stale
    useEffect(() => { hangUpRef.current = hangUp; }, [hangUp]);

    // ── Mute toggle — also notify remote via socket ───────────────────────────
    const toggleMute = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        const next = !isMuted;
        stream.getAudioTracks().forEach((t) => { t.enabled = !next; });
        setIsMuted(next);
        // Notify remote
        socket?.current?.emit("call-media-state", {
            to: String(peerIdRef.current),
            muted: next,
        });
    }, [isMuted, socket]);

    // ── Camera toggle — also notify remote ───────────────────────────────────
    const toggleCamera = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        const next = !isCameraOff;
        stream.getVideoTracks().forEach((t) => { t.enabled = !next; });
        setIsCameraOff(next);
        // Notify remote
        socket?.current?.emit("call-media-state", {
            to: String(peerIdRef.current),
            cameraOff: next,
        });
    }, [isCameraOff, socket]);

    // ── Socket event listeners ────────────────────────────────────────────────
    useEffect(() => {
        const s = socket?.current;
        if (!s) return;

        const onOffer = ({ offer }) => {
            // Only callee processes offers
            if (!isCaller) handleOffer(offer);
        };
        const onAnswer = ({ answer }) => {
            // Only caller processes answers
            if (isCaller) handleAnswer(answer);
        };
        const onICE = ({ candidate }) => handleICECandidate(candidate);
        const onCallEnded = () => { cleanup(); endCallStore(); };
        const onMediaState = ({ muted, cameraOff }) => {
            if (muted !== undefined) setRemoteMuted(muted);
            if (cameraOff !== undefined) setRemoteCameraOff(cameraOff);
        };

        s.on("webrtc-offer", onOffer);
        s.on("webrtc-answer", onAnswer);
        s.on("webrtc-ice-candidate", onICE);
        s.on("call-ended", onCallEnded);
        s.on("call-media-state", onMediaState);

        return () => {
            s.off("webrtc-offer", onOffer);
            s.off("webrtc-answer", onAnswer);
            s.off("webrtc-ice-candidate", onICE);
            s.off("call-ended", onCallEnded);
            s.off("call-media-state", onMediaState);
        };
    }, [socket, isCaller, handleOffer, handleAnswer, handleICECandidate, cleanup, endCallStore]);

    // ── Caller: watch callAccepted and start once ─────────────────────────────
    const callAccepted = useCallStore((s) => s.callAccepted);
    const startedRef = useRef(false);
    useEffect(() => {
        if (isCaller && callAccepted && !startedRef.current) {
            startedRef.current = true;
            startCall();
        }
    }, [isCaller, callAccepted, startCall]);

    // ── Callee: init peer on mount, then handle any buffered offer ────────────
    useEffect(() => {
        if (!isCaller) {
            initPeer().then(() => {
                // If an offer arrived before initPeer completed, handle it now
                if (pendingOfferRef.current) {
                    const offer = pendingOfferRef.current;
                    pendingOfferRef.current = null;
                    handleOffer(offer);
                }
            });
        }
        return () => { cleanup(); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        localVideoRef,
        remoteVideoRef,
        localStream,
        remoteStream,
        isMuted,
        isCameraOff,
        remoteMuted,
        remoteCameraOff,
        toggleMute,
        toggleCamera,
        hangUp,
        connectionState,
    };
}
