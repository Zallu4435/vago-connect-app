"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { FaMicrophone, FaStop, FaPlay, FaPause, FaTrash } from "react-icons/fa";
import { MdSend } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useSocketStore } from "@/stores/socketStore";
import { useUploadAudio } from "@/hooks/mutations/useUploadAudio";
import { showToast } from "@/lib/toast";

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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={close}
      />

      {/* Recording Interface */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-ancient-bg-dark border-t-2 border-ancient-icon-glow/30 shadow-2xl animate-slide-in-up">
        <audio ref={audioRef} hidden />

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-ancient-text-light text-lg sm:text-xl font-semibold">
              {isRecording ? "Recording..." : recordedBlob ? "Review Recording" : "Voice Message"}
            </h3>
            <button
              onClick={close}
              className="p-2 rounded-full bg-ancient-bg-medium hover:bg-red-600/20 text-ancient-text-muted hover:text-red-500 transition-all"
              aria-label="Close"
            >
              <IoClose className="text-2xl" />
            </button>
          </div>

          {/* Recording/Playback Area */}
          <div className="bg-ancient-bg-medium rounded-2xl p-6 sm:p-8 mb-6 border border-ancient-border-stone/50">
            {/* Waveform Animation (when recording) */}
            {isRecording && (
              <div className="flex items-center justify-center gap-1.5 h-20 mb-4">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-ancient-icon-glow rounded-full animate-pulse"
                    style={{
                      height: `${20 + Math.random() * 60}%`,
                      animationDelay: `${i * 0.05}s`,
                      animationDuration: `${0.5 + Math.random() * 0.5}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Playback Progress (when recorded) */}
            {recordedBlob && !isRecording && (
              <div className="mb-4">
                <div className="h-2 bg-ancient-border-stone rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-ancient-icon-glow rounded-full transition-all duration-100"
                    style={{ width: `${playbackProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-ancient-text-muted">
                  <span>{formatTime(playbackTime)}</span>
                  <span>{formatTime(playbackDuration)}</span>
                </div>
              </div>
            )}

            {/* Timer/Status */}
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-ancient-icon-glow mb-2 tabular-nums">
                {isRecording
                  ? formatTime(recordingDuration)
                  : recordedBlob
                    ? formatTime(playbackDuration)
                    : "0:00"}
              </div>
              <p className="text-ancient-text-muted text-sm">
                {isRecording
                  ? "Recording in progress..."
                  : recordedBlob
                    ? "Tap play to review"
                    : "Tap the microphone to start"}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {!recordedBlob ? (
              // Recording controls
              <>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all transform hover:scale-105 active:scale-95 ${isRecording
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-ancient-icon-glow hover:bg-green-500"
                    }`}
                  aria-label={isRecording ? "Stop Recording" : "Start Recording"}
                >
                  {isRecording ? (
                    <FaStop className="text-2xl sm:text-3xl" />
                  ) : (
                    <FaMicrophone className="text-2xl sm:text-3xl" />
                  )}
                </button>
              </>
            ) : (
              // Playback controls
              <>
                <button
                  onClick={deleteRecording}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-ancient-bg-medium hover:bg-red-600/20 text-ancient-text-muted hover:text-red-500 transition-all transform hover:scale-105 active:scale-95"
                  aria-label="Delete Recording"
                >
                  <FaTrash className="text-lg sm:text-xl" />
                </button>

                <button
                  onClick={togglePlayback}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center bg-ancient-icon-glow hover:bg-green-500 text-ancient-bg-dark shadow-xl transition-all transform hover:scale-105 active:scale-95"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <FaPause className="text-2xl sm:text-3xl" />
                  ) : (
                    <FaPlay className="text-2xl sm:text-3xl ml-1" />
                  )}
                </button>

                <button
                  onClick={sendRecording}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-ancient-icon-glow hover:bg-green-500 text-ancient-bg-dark shadow-xl transition-all transform hover:scale-105 active:scale-95"
                  aria-label="Send Recording"
                  disabled={uploadAudioMutation.isPending}
                >
                  <MdSend className="text-lg sm:text-xl" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default CaptureAudio;