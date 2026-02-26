"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { FaMicrophone, FaPlay, FaPause, FaTrash } from "react-icons/fa";
import { MdSend } from "react-icons/md";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useSocketStore } from "@/stores/socketStore";
import { useUploadAudio } from '@/hooks/messages/useUploadAudio';
import { showToast } from "@/lib/toast";
import AnimatedWave from "@/components/common/AnimatedWave";

function formatTime(secs) {
  if (!Number.isFinite(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function CaptureAudio({ onChange }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const messages = useChatStore((s) => s.messages);
  const setMessages = useChatStore((s) => s.setMessages);
  const socket = useSocketStore((s) => s.socket);
  const uploadAudioMutation = useUploadAudio();

  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const playbackTimerRef = useRef(null);

  const cleanup = useCallback(() => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    try {
      if (mediaRecorderRef.current?.state !== "inactive") {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
    } catch { }
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    } catch { }
  }, []);

  // Cancel everything and close the recorder
  const cancel = useCallback(() => {
    cleanup();
    setRecordedBlob(null);
    setIsRecording(false);
    setIsPlaying(false);
    setRecordingDuration(0);
    setPlaybackTime(0);
    setPlaybackDuration(0);
    onChange?.(false);
  }, [cleanup, onChange]);

  useEffect(() => () => cleanup(), [cleanup]);

  const startRecording = useCallback(async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      showToast.error("Microphone access not available.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data?.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        if (audioRef.current) {
          audioRef.current.src = URL.createObjectURL(blob);
          audioRef.current.load();
          audioRef.current.onloadedmetadata = () => {
            setPlaybackDuration(audioRef.current?.duration || 0);
            setPlaybackTime(0);
          };
          audioRef.current.onended = () => {
            setIsPlaying(false);
            setPlaybackTime(0);
            if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
          };
        }
      };

      mediaRecorderRef.current = mr;
      setRecordingDuration(0);
      setRecordedBlob(null);
      setIsRecording(true);
      setIsPlaying(false);
      setPlaybackTime(0);
      setPlaybackDuration(0);
      mr.start();
      recordingTimerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000);
    } catch {
      showToast.error("Failed to access microphone.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  }, [isRecording]);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !recordedBlob) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      playbackTimerRef.current = setInterval(() => {
        if (audioRef.current) setPlaybackTime(audioRef.current.currentTime);
      }, 50);
    }
  }, [isPlaying, recordedBlob]);

  const sendRecording = useCallback(async () => {
    if (!recordedBlob || !userInfo?.id || !currentChatUser?.id) return;
    const form = new FormData();
    form.append("audio", recordedBlob, "recording.webm");
    form.append("from", String(userInfo.id));
    form.append("to", String(currentChatUser.id));
    if (currentChatUser?.isGroup || currentChatUser?.type === "group")
      form.append("isGroup", "true");

    const toastId = showToast.loading("Sending voice message...");
    uploadAudioMutation.mutate(form, {
      onSuccess: (data) => {
        showToast.dismiss(toastId);
        showToast.success("Voice message sent!");
        socket.current?.emit("send-msg", {
          to: currentChatUser.id,
          from: userInfo.id,
          message: data.content,
          type: data.type || "audio",
          timestamp: Date.now(),
          messageStatus: "sent",
        });
        setMessages([...(messages || []), data]);
        cancel();
      },
      onError: () => {
        showToast.dismiss(toastId);
        showToast.error("Failed to send. Try again.");
      },
    });
  }, [recordedBlob, userInfo, currentChatUser, uploadAudioMutation, socket, messages, setMessages, cancel]);

  const playbackProgress = playbackDuration ? (playbackTime / playbackDuration) * 100 : 0;

  // ─── Derived state ──────────────────────────────────────────
  const isIdle = !isRecording && !recordedBlob;
  const isReady = !isRecording && !!recordedBlob;

  return (
    <div className="flex-1 flex items-center gap-2 sm:gap-3 w-full animate-fade-in">
      <audio ref={audioRef} hidden />

      {/* ── Zone 1: Discard / Cancel (always visible, same position) ── */}
      <button
        onClick={cancel}
        className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-ancient-text-muted hover:text-red-400 hover:bg-red-400/10 transition-all active:scale-95"
        aria-label="Cancel"
        title="Cancel recording"
      >
        <FaTrash className="text-sm" />
      </button>

      {/* ── Zone 2: Main pill ── */}
      <div className="flex-1 flex items-center gap-2 bg-ancient-input-bg border border-ancient-input-border rounded-2xl px-3 h-11 min-w-0 shadow-inner overflow-hidden">

        {/* IDLE: prompt */}
        {isIdle && (
          <span className="text-ancient-text-muted text-sm italic select-none w-full text-center">
            Tap the mic to start recording
          </span>
        )}

        {/* RECORDING: red dot + timer + live waveform */}
        {isRecording && (
          <>
            <span className="relative flex-shrink-0 w-2 h-2">
              <span className="animate-ping absolute inset-0 rounded-full bg-red-500 opacity-75" />
              <span className="relative block w-2 h-2 rounded-full bg-red-500" />
            </span>
            <span className="text-red-400 font-semibold tabular-nums text-sm flex-shrink-0 min-w-[2.4rem]">
              {formatTime(recordingDuration)}
            </span>
            <div className="flex-1 flex items-center overflow-hidden">
              <AnimatedWave isLive={true} isPlaying={false} progress={0} />
            </div>
          </>
        )}

        {/* READY: play/pause + waveform scrubber + single timer on right */}
        {isReady && (
          <>
            {/* Play / Pause */}
            <button
              onClick={togglePlayback}
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-ancient-icon-glow text-ancient-bg-dark hover:brightness-110 active:scale-95 transition-all shadow-sm"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying
                ? <FaPause className="text-[10px]" />
                : <FaPlay className="text-[10px] ml-px" />}
            </button>

            {/* Waveform scrubber */}
            <div
              className="flex-1 flex items-center overflow-hidden cursor-pointer"
              role="slider"
              aria-label="Playback position"
              aria-valuenow={playbackTime}
              aria-valuemin={0}
              aria-valuemax={playbackDuration}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                if (audioRef.current) {
                  audioRef.current.currentTime = frac * playbackDuration;
                  setPlaybackTime(audioRef.current.currentTime);
                }
              }}
            >
              <AnimatedWave isPlaying={isPlaying} isLive={false} progress={playbackProgress} />
            </div>

            {/* Single timer — shows playback time / duration */}
            <span className="flex-shrink-0 tabular-nums text-[11px] text-ancient-text-muted whitespace-nowrap">
              {formatTime(isPlaying ? playbackTime : playbackDuration)}
            </span>
          </>
        )}
      </div>

      {/* ── Zone 3: Action button — mic / stop / send ── */}
      <div className="flex-shrink-0">
        {/* Idle → start recording (green mic) */}
        {isIdle && (
          <button
            onClick={startRecording}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-ancient-icon-glow text-ancient-bg-dark shadow-md hover:brightness-110 hover:scale-105 active:scale-95 transition-all"
            aria-label="Start Recording"
          >
            <FaMicrophone className="text-lg" />
          </button>
        )}

        {/* Recording → stop (red square-stop) */}
        {isRecording && (
          <button
            onClick={stopRecording}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-red-500 text-white shadow-md shadow-red-500/30 hover:bg-red-600 hover:scale-105 active:scale-95 transition-all"
            aria-label="Stop Recording"
          >
            <span className="w-4 h-4 bg-white rounded-sm" />
          </button>
        )}

        {/* Ready → send */}
        {isReady && (
          <button
            onClick={sendRecording}
            disabled={uploadAudioMutation.isPending}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-ancient-icon-glow text-ancient-bg-dark shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            aria-label="Send Recording"
          >
            {uploadAudioMutation.isPending
              ? <div className="w-5 h-5 border-2 border-ancient-bg-dark border-t-transparent rounded-full animate-spin" />
              : <MdSend className="text-xl mr-0.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default CaptureAudio;