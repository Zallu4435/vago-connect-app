"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { FaMicrophone, FaStop, FaPlay, FaPause } from "react-icons/fa";
import { MdSend } from "react-icons/md";
import { FaMagic, FaWater, FaSpinner } from "react-icons/fa"; // Reliable icons
import { IoClose } from "react-icons/io5"; // For a clear close/cancel icon
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useSocketStore } from "@/stores/socketStore";
import { useUploadAudio } from "@/hooks/mutations/useUploadAudio";
import { showToast } from "@/lib/toast";
import Image from "next/image"; // For user avatar
import BaseVoicePlayer from "@/components/common/BaseVoicePlayer";

// Helper for time formatting
function formatTime(secs) {
  if (!Number.isFinite(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function CaptureAudio({ onChange, hide }) {
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
  const [audioPlaybackCurrentTime, setAudioPlaybackCurrentTime] = useState(0);
  const [audioPlaybackDuration, setAudioPlaybackDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null); // For legacy playback; BaseVoicePlayer used for UI
  const recordingTimerRef = useRef(null); // For tracking recording duration
  const playbackTimerRef = useRef(null); // For tracking playback duration

  // Internal cleanup that does NOT notify parent; used for unmount (StrictMode safe)
  const internalCleanup = useCallback(() => {
    stopRecordingTimer();
    stopPlaybackTimer();
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    } catch {}
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    } catch {}
  }, []);

  const close = useCallback(() => {
    internalCleanup();
    setRecordedBlob(null);
    setIsRecording(false);
    setIsPlaying(false);
    setRecordingDuration(0);
    setAudioPlaybackCurrentTime(0);
    setAudioPlaybackDuration(0);
    onChange?.(false);
    hide?.();
  }, [internalCleanup, onChange, hide]);

  useEffect(() => {
    return () => {
      internalCleanup(); // Do not trigger onChange(false) during StrictMode test unmount
    };
  }, [internalCleanup]);

  const startRecordingTimer = () => {
    stopRecordingTimer(); // Clear any existing timer
    recordingTimerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000);
  };
  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
  };

  const startPlaybackTimer = () => {
    stopPlaybackTimer();
    playbackTimerRef.current = setInterval(() => {
      if (audioRef.current) setAudioPlaybackCurrentTime(audioRef.current.currentTime);
    }, 50); // Update frequently for smoother progress bar
  };
  const stopPlaybackTimer = () => {
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    playbackTimerRef.current = null;
  };

  const handleStartRecording = useCallback(async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      showToast.error("Microphone access not available.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        stream.getTracks().forEach((t) => t.stop()); // Stop the microphone stream
        stopRecordingTimer();
        // Prepare for playback
        if (audioRef.current) {
          audioRef.current.src = URL.createObjectURL(blob);
          audioRef.current.load();
          audioRef.current.onloadedmetadata = () => {
            setAudioPlaybackDuration(audioRef.current?.duration || 0);
            setAudioPlaybackCurrentTime(0);
          };
          audioRef.current.onended = () => {
            setIsPlaying(false);
            setAudioPlaybackCurrentTime(0);
            stopPlaybackTimer();
          };
        }
      };
      mediaRecorderRef.current = mr;
      setRecordingDuration(0);
      setRecordedBlob(null);
      setIsRecording(true);
      setIsPlaying(false);
      setAudioPlaybackCurrentTime(0);
      setAudioPlaybackDuration(0);
      mr.start();
      startRecordingTimer();
    } catch (err) {
      console.error("Audio getUserMedia error", err);
      showToast.error("Failed to access microphone.");
    }
  }, []);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopRecordingTimer();
    }
  }, [isRecording]);

  const handleTogglePlayback = useCallback(() => {
    // No-op; playback handled by BaseVoicePlayer
  }, []);

  const handleSendRecording = useCallback(async () => {
    if (!recordedBlob || !userInfo?.id || !currentChatUser?.id) return;

    const form = new FormData();
    form.append("audio", recordedBlob, "recording.webm");
    form.append("from", String(userInfo.id));
    form.append("to", String(currentChatUser.id));

    const toastId = showToast.loading("Conjuring echo...");
    uploadAudioMutation.mutate(form, {
      onSuccess: (data) => {
        showToast.dismiss(toastId);
        showToast.success("Echo conjured!");
        socket.current?.emit("send-msg", {
          to: currentChatUser.id,
          from: userInfo.id,
          message: data.content,
          type: data.type || "audio",
          timestamp: Date.now(), // Add timestamp here
          messageStatus: "sent", // Assuming initial status
        });
        setMessages([...(messages || []), data]);
        close();
      },
      onError: (err) => {
        showToast.dismiss(toastId);
        showToast.error("Conjuration failed. Try again.");
        console.error("sendAudio error", err);
      },
    });
  }, [recordedBlob, userInfo, currentChatUser, uploadAudioMutation, socket, messages, setMessages, close]);


  const playbackProgress = audioPlaybackDuration ? (audioPlaybackCurrentTime / audioPlaybackDuration) * 100 : 0;
  const previewUrl = React.useMemo(() => {
    if (!recordedBlob) return "";
    const url = URL.createObjectURL(recordedBlob);
    return url;
  }, [recordedBlob]);
  useEffect(() => {
    return () => {
      try {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      } catch {}
    };
  }, [previewUrl]);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 bg-ancient-bg-dark border-t border-ancient-border-stone flex items-center justify-between p-3 gap-4 shadow-2xl animate-slide-in-up">
      <audio ref={audioRef} hidden /> {/* Hidden audio element for playback */}

      {/* User Avatar */}
      {userInfo?.profileImage && (
        <div className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0 bg-ancient-input-bg border border-ancient-icon-glow">
          <Image src={userInfo.profileImage} alt="User Avatar" fill className="object-cover" />
        </div>
      )}

      {/* Cancel Button */}
      <button
        onClick={close}
        className="p-2 rounded-full bg-red-700/70 hover:bg-red-600 text-white transition-colors duration-200 shadow-md"
        aria-label="Cancel Recording"
      >
        <IoClose className="text-xl" />
      </button>

      {/* Main Recording/Playback Area */}
      <div className="flex-1 flex items-center gap-3 bg-ancient-input-bg rounded-full py-2 px-4 shadow-inner border border-ancient-input-border">

        {/* Recording/Playback Indicator & Timer */}
        {recordedBlob && !isRecording ? ( // Reviewing state
          <div className="flex-1">
            <BaseVoicePlayer src={previewUrl} isIncoming={false} showAvatars={Boolean(userInfo?.profileImage)} leftAvatarUrl={userInfo?.profileImage} />
          </div>
        ) : ( // Recording or initial idle state
          <>
            <FaWater className={`text-2xl ${isRecording ? 'text-red-500 animate-pulse' : 'text-ancient-text-muted'}`} />
            <span className={`flex-1 text-center text-lg ${isRecording ? 'text-red-500 animate-pulse' : 'text-ancient-text-muted'}`}>
              {isRecording ? `Recording ${formatTime(recordingDuration)}` : 'Tap to start recording'}
            </span>
          </>
        )}
      </div>

      {/* Record/Stop Button */}
      {!recordedBlob ? ( // If no recording exists, show record button
        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          className={`p-4 rounded-full text-white shadow-lg transition-colors duration-200
            ${isRecording ? "bg-red-600 hover:bg-red-500" : "bg-ancient-icon-glow hover:bg-green-500"}`}
          aria-label={isRecording ? "Stop Recording" : "Start Recording"}
        >
          {isRecording ? <FaStop className="text-xl" /> : <FaMicrophone className="text-xl" />}
        </button>
      ) : ( // If recording exists, show send button
        <button
          onClick={handleSendRecording}
          className="p-4 rounded-full bg-ancient-icon-glow hover:bg-green-500 text-ancient-bg-dark shadow-lg transition-colors duration-200"
          aria-label="Send Recording"
          disabled={uploadAudioMutation.isPending}
        >
          {uploadAudioMutation.isPending ? <FaSpinner className="text-xl animate-spin" /> : <MdSend className="text-xl" />}
        </button>
      )}
    </div>
  );
}

export default CaptureAudio;