"use client";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { FaMicrophone, FaStop, FaPlay, FaPause, FaTrash } from "react-icons/fa";
import { MdSend } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useSocketStore } from "@/stores/socketStore";
import { useUploadAudio } from "@/hooks/mutations/useUploadAudio";
import { showToast } from "@/lib/toast";
import LoadingSpinner from "@/components/common/LoadingSpinner";

// Helper for time formatting
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

  // Cleanup
  const cleanup = useCallback(() => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    try {
      if (mediaRecorderRef.current?.state !== "inactive") {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    } catch { }
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    } catch { }
  }, []);

  const close = useCallback(() => {
    cleanup();
    setRecordedBlob(null);
    setIsRecording(false);
    setIsPlaying(false);
    setRecordingDuration(0);
    setPlaybackTime(0);
    setPlaybackDuration(0);
    onChange?.(false);
  }, [cleanup, onChange]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Start recording
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
    } catch (err) {
      console.error("Audio getUserMedia error", err);
      showToast.error("Failed to access microphone.");
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  }, [isRecording]);

  // Toggle playback
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

  // Delete recording
  const deleteRecording = useCallback(() => {
    setRecordedBlob(null);
    setPlaybackTime(0);
    setPlaybackDuration(0);
    setIsPlaying(false);
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
  }, []);

  // Send recording
  const sendRecording = useCallback(async () => {
    if (!recordedBlob || !userInfo?.id || !currentChatUser?.id) return;

    const form = new FormData();
    form.append("audio", recordedBlob, "recording.webm");
    form.append("from", String(userInfo.id));
    form.append("to", String(currentChatUser.id));
    const isGroup = currentChatUser?.isGroup || currentChatUser?.type === 'group';
    if (isGroup) form.append("isGroup", "true");

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
        close();
      },
      onError: (err) => {
        showToast.dismiss(toastId);
        showToast.error("Failed to send. Try again.");
        console.error("sendAudio error", err);
      },
    });
  }, [recordedBlob, userInfo, currentChatUser, uploadAudioMutation, socket, messages, setMessages, close]);

  const playbackProgress = playbackDuration ? (playbackTime / playbackDuration) * 100 : 0;

  const staticHeights = useMemo(() => Array.from({ length: 30 }, () => 0.2 + Math.random() * 0.8), []);

  return (
    <div className="flex-1 flex items-center justify-between gap-2 sm:gap-4 bg-transparent animate-fade-in w-full">
      <audio ref={audioRef} hidden />

      {/* Delete/Close Button */}
      <button
        onClick={close}
        className="p-2 sm:p-2.5 rounded-full hover:bg-red-500/10 text-ancient-text-muted hover:text-red-500 transition-colors active:scale-95 flex-shrink-0"
        aria-label="Discard Recording"
      >
        <FaTrash className="text-lg" />
      </button>

      {/* Timer / Visualizer / Progress */}
      <div className="flex-1 flex items-center bg-ancient-input-bg border border-ancient-input-border rounded-full px-4 h-11 sm:h-12 relative overflow-hidden shadow-inner">
        {/* Timer */}
        <div className="text-ancient-icon-glow font-medium tabular-nums min-w-[3.5rem] flex-shrink-0 text-sm sm:text-base">
          {isRecording
            ? formatTime(recordingDuration)
            : recordedBlob
              ? formatTime(playbackTime)
              : "0:00"}
        </div>

        {/* Visualizer (Recording) */}
        {isRecording && (
          <div className="flex-1 flex items-center justify-center gap-0.5 sm:gap-1 h-6 px-2 overflow-hidden mask-edges">
            {staticHeights.map((h, i) => (
              <div
                key={i}
                className="w-1 bg-ancient-icon-glow rounded-full"
                style={{
                  height: '100%',
                  transformOrigin: 'bottom',
                  animation: `audio-wave ${0.4 + (i % 3) * 0.2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Playback Track (Recorded) */}
        {recordedBlob && !isRecording && (
          <div className="flex-1 flex items-center px-1 sm:px-2 h-full gap-2 sm:gap-3">
            <button
              onClick={togglePlayback}
              className="text-ancient-text-muted hover:text-white flex-shrink-0 transition-all active:scale-95"
            >
              {isPlaying ? <FaPause className="text-sm" /> : <FaPlay className="text-sm ml-0.5" />}
            </button>
            <div
              className="flex-1 flex items-center justify-between gap-[2px] h-6 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                if (audioRef.current) {
                  audioRef.current.currentTime = percent * playbackDuration;
                  setPlaybackTime(audioRef.current.currentTime);
                }
              }}
            >
              {staticHeights.map((h, i) => {
                const isPlayed = (i / 30) * 100 <= playbackProgress;
                return (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-colors duration-200 ${isPlayed ? 'bg-ancient-icon-glow' : 'bg-ancient-text-muted opacity-40'}`}
                    style={{
                      height: '100%',
                      transformOrigin: 'bottom',
                      transform: isPlaying ? undefined : `scaleY(${h})`,
                      animation: isPlaying ? `audio-wave ${0.4 + (i % 3) * 0.2}s ease-in-out infinite` : 'none',
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Primary Action Button (Record vs Send) */}
      <div className="flex-shrink-0 relative">
        {!recordedBlob ? (
          // Recording toggle
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white shadow-md transition-all transform hover:scale-105 active:scale-95 ${isRecording
              ? "bg-red-500 shadow-red-500/20"
              : "bg-ancient-icon-glow shadow-ancient-icon-glow/20"
              }`}
            aria-label={isRecording ? "Stop Recording" : "Start Recording"}
          >
            {isRecording ? (
              <div className="w-3.5 h-3.5 bg-white rounded-sm animate-pulse" /> // Square for stop
            ) : (
              <FaMicrophone className="text-lg" />
            )}
          </button>
        ) : (
          // Send button
          <button
            onClick={sendRecording}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-ancient-icon-glow hover:brightness-110 text-ancient-bg-dark shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send Recording"
            disabled={uploadAudioMutation.isPending}
          >
            {uploadAudioMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-ancient-bg-dark border-t-transparent rounded-full animate-spin" />
            ) : (
              <MdSend className="text-xl mr-0.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default CaptureAudio;