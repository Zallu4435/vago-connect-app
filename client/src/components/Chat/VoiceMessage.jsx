"use client";
import React, { useEffect, useRef, useState } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { useChatStore } from "@/stores/chatStore";

function formatTime(secs) {
  if (!Number.isFinite(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function VoiceMessage({ message }) {
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  const isIncoming = message?.senderId === currentChatUser?.id;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrent(audio.currentTime || 0);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, [message?.content]);

  // Reset playback when message changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      setIsPlaying(false);
      setCurrent(0);
      audio.pause();
      audio.currentTime = 0;
      // Ensure new src is applied
      audio.load();
    } catch {}
  }, [message?.content]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const progress = duration ? Math.min(100, Math.max(0, (current / duration) * 100)) : 0;

  return (
    <div
      className={`text-white px-3 py-3 text-sm rounded-md flex items-center gap-3 max-w-[75%] ${isIncoming ? "bg-incoming-background" : "bg-outgoing-background"}`}
      onClick={togglePlay}
    >
      <button
        type="button"
        onClick={togglePlay}
        className="shrink-0 w-8 h-8 rounded-full bg-panel-header-background flex items-center justify-center cursor-pointer z-10"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>
      <div className="flex-1">
        <div className="h-1.5 bg-[#ffffff22] rounded overflow-hidden">
          <div className="h-full bg-[#7ae3c3]" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-bubble-meta text-[11px] pt-1">
          <span>{formatTime(current)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <audio
        ref={audioRef}
        preload="metadata"
        crossOrigin="anonymous"
        src={message?.content}
        className="pointer-events-none"
        onError={async () => {
          // Fallback: fetch the audio and play from a blob URL
          try {
            const resp = await fetch(message?.content, { credentials: "omit" });
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const audio = audioRef.current;
            if (audio) {
              audio.src = url;
              await audio.play();
              setIsPlaying(true);
            }
          } catch {}
        }}
      >
        <source src={message?.content} type="audio/webm" />
        <source src={message?.content} type="audio/ogg" />
        <source src={message?.content} type="audio/mpeg" />
      </audio>
    </div>
  );
}

export default VoiceMessage;
