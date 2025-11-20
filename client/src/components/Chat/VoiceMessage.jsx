"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { useChatStore } from "@/stores/chatStore";
import Image from "next/image"; // Assuming you might want sender avatars

// Helper for time formatting
function formatTime(secs) {
  if (!Number.isFinite(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Animated Wave Component (Simulated)
const AnimatedWave = ({ isPlaying, progress }) => {
  return (
    <div className="relative flex-1 h-8 overflow-hidden flex items-center">
      {/* Background for the played portion */}
      <div
        className="absolute inset-0 bg-ancient-icon-glow/20 rounded-full"
        style={{ width: `${progress}%` }}
      ></div>
      {/* Animated wave lines */}
      <div className={`relative flex items-center justify-between w-full h-full px-1 ${isPlaying ? 'animate-pulse-waves' : ''}`}>
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="w-0.5 rounded-full bg-ancient-text-muted transition-all duration-100 ease-in-out"
            style={{
              height: `${isPlaying ? Math.max(8, Math.random() * 24) : 8}px`, // Dynamic height when playing
              minHeight: '8px',
              backgroundColor: isPlaying ? 'var(--ancient-icon-glow)' : 'var(--ancient-text-muted)',
              transition: 'height 0.1s, background-color 0.3s',
              animationDelay: `${i * 0.05}s`, // Stagger animation
            }}
          ></div>
        ))}
      </div>
       {/* Overlay to dim unplayed portion of the wave */}
       <div
        className="absolute inset-0 bg-ancient-bg-dark/50"
        style={{ left: `${progress}%` }}
      ></div>
    </div>
  );
};


function VoiceMessage({ message }) {
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [hasError, setHasError] = useState(false);

  const isIncoming = message?.senderId === currentChatUser?.id;
  const senderName = message?.sender?.name || "Unknown"; // Assuming message has sender details
  const senderAvatar = message?.sender?.profileImage || "/default_mystical_avatar.png";

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.error("Audio playback error:", e);
          setHasError(true);
          setIsPlaying(false);
        });
    }
  }, [isPlaying]);

  const handleAudioError = useCallback(async () => {
    setHasError(true);
    setIsPlaying(false);
    // Fallback: fetch the audio and play from a blob URL
    try {
      console.log("Attempting audio fallback via Blob URL...");
      const resp = await fetch(message?.content, { credentials: "omit" });
      if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = audioRef.current;
      if (audio) {
        audio.src = url;
        audio.load(); // Reload audio element with blob URL
        await audio.play();
        setIsPlaying(true);
        setHasError(false); // Clear error if playback succeeds
      }
    } catch (e) {
      console.error("Audio fallback failed:", e);
      setHasError(true);
    }
  }, [message?.content]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setHasError(false); // Clear any previous error on new metadata load
    };
    const onTimeUpdate = () => setCurrent(audio.currentTime || 0);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrent(0); // Reset to start on end
    };
    const onError = () => handleAudioError(); // Use the useCallback version

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError); // Listen for playback errors

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [message?.content, handleAudioError]);

  // Reset playback when message content changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      setIsPlaying(false);
      setCurrent(0);
      audio.pause();
      audio.currentTime = 0;
      audio.load(); // Ensure new src is applied and reloaded
      setHasError(false); // Reset error state for new message
    } catch {}
  }, [message?.content]);

  const progress = duration ? Math.min(100, Math.max(0, (current / duration) * 100)) : 0;

  return (
    <div
      className={`relative flex items-center gap-3 p-3 rounded-xl shadow-lg transition-colors duration-200 min-w-[250px] max-w-[85%]
        ${isIncoming ? "bg-ancient-bubble-incoming border border-ancient-input-border text-ancient-text-light" : "bg-ancient-bubble-user border border-ancient-icon-glow text-ancient-bg-dark"}`}
    >
      {/* Sender Avatar for Incoming Messages */}
      {isIncoming && message?.sender && (
        <div className="relative h-9 w-9 rounded-full overflow-hidden flex-shrink-0 bg-ancient-input-bg border border-ancient-border-stone">
          <Image src={senderAvatar} alt={senderName} fill className="object-cover" />
        </div>
      )}

      <button
        type="button"
        onClick={togglePlay}
        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer z-10 text-xl transition-all duration-200
          ${isIncoming ? "bg-ancient-icon-glow text-ancient-bg-dark hover:bg-green-500" : "bg-ancient-bg-dark text-ancient-icon-glow hover:bg-ancient-input-bg"}`}
        aria-label={isPlaying ? "Pause Echo" : "Play Echo"}
        disabled={hasError}
      >
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>

      <div className="flex-1 flex flex-col justify-center min-w-0">
        <AnimatedWave isPlaying={isPlaying} progress={progress} />

        <div className={`flex justify-between text-[11px] pt-1
          ${isIncoming ? "text-ancient-text-muted" : "text-ancient-bg-dark/80"}`}>
          <span>{formatTime(current)}</span>
          <span className="font-medium">{formatTime(duration)}</span>
        </div>
        {hasError && (
          <div className="text-red-500 text-xs mt-1">
            Failed to conjure echo.
          </div>
        )}
      </div>

      {/* Sender Avatar for Outgoing Messages */}
      {!isIncoming && message?.sender && (
        <div className="relative h-9 w-9 rounded-full overflow-hidden flex-shrink-0 bg-ancient-input-bg border border-ancient-icon-glow">
          <Image src={senderAvatar} alt={senderName} fill className="object-cover" />
        </div>
      )}

      <audio
        ref={audioRef}
        preload="metadata"
        crossOrigin="anonymous"
        src={message?.content}
        className="sr-only" // Hide the default audio player
        // The onError prop for the <audio> tag is less reliable,
        // relying more on the event listener in useEffect for robust error handling.
      >
        {/* Providing multiple sources is good practice */}
        <source src={message?.content} type="audio/webm" />
        <source src={message?.content} type="audio/ogg" />
        <source src={message?.content} type="audio/mpeg" />
      </audio>
    </div>
  );
}

export default VoiceMessage;