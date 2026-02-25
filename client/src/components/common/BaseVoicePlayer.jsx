"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { RiShareForwardFill } from "react-icons/ri";
import AnimatedWave from "@/components/common/AnimatedWave";
import { formatDuration } from "@/utils/formatDuration";
import Image from "next/image";

/**
 * BaseVoicePlayer
 * A reusable audio player with waveform and duration, used for voice messages or previews.
 *
 * Props:
 * - src: string (audio URL)
 * - isIncoming: boolean (styling toggle)
 * - leftAvatarUrl?: string
 * - rightAvatarUrl?: string
 * - showAvatars?: boolean (default false)
 * - onPlayChange?: (playing: boolean) => void
 */
export default function BaseVoicePlayer({
  src,
  isIncoming = false,
  isForwarded = false,
  senderName,
  leftAvatarUrl,
  rightAvatarUrl,
  showAvatars = false,
  onPlayChange,
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [hasError, setHasError] = useState(false);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      onPlayChange?.(false);
    } else {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          onPlayChange?.(true);
        })
        .catch(() => {
          setHasError(true);
          setIsPlaying(false);
          onPlayChange?.(false);
        });
    }
  }, [isPlaying, onPlayChange]);

  const handleAudioError = useCallback(async () => {
    setHasError(true);
    setIsPlaying(false);
    onPlayChange?.(false);
    // Fallback: fetch as blob and play
    try {
      const resp = await fetch(src, { credentials: "omit" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = audioRef.current;
      if (audio) {
        audio.src = url;
        audio.load();
        await audio.play();
        setIsPlaying(true);
        setHasError(false);
        onPlayChange?.(true);
      }
    } catch {
      setHasError(true);
    }
  }, [src, onPlayChange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setHasError(false);
    };
    const onTimeUpdate = () => setCurrent(audio.currentTime || 0);
    const onEnded = () => {
      setIsPlaying(false);
      onPlayChange?.(false);
      setCurrent(0);
    };
    const onError = () => handleAudioError();
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [handleAudioError, onPlayChange]);

  // Reset on src change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      setIsPlaying(false);
      onPlayChange?.(false);
      setCurrent(0);
      audio.pause();
      audio.currentTime = 0;
      audio.src = src || "";
      audio.load();
      setHasError(false);
    } catch { }
  }, [src, onPlayChange]);

  const progress = useMemo(() => (duration ? Math.min(100, Math.max(0, (current / duration) * 100)) : 0), [current, duration]);

  const bubbleClass = isIncoming
    ? "bg-ancient-bubble-user text-ancient-text-light border-ancient-input-border"
    : "bg-ancient-bubble-other text-ancient-text-light border-ancient-icon-glow/30";

  return (
    <div
      className={`relative flex flex-col gap-1 px-3 py-2 rounded-xl shadow-lg border transition-all duration-200 min-w-[260px] max-w-full ${bubbleClass}`}
    >
      {/* Sender name for group chats */}
      {senderName && (
        <div className="text-[11px] font-bold text-ancient-text-muted opacity-90 truncate">
          ~ {senderName}
        </div>
      )}
      {/* Forwarded label */}
      {isForwarded && (
        <div className="flex items-center gap-1 text-[11px] text-ancient-text-muted italic">
          <RiShareForwardFill className="text-xs" />
          <span>Forwarded</span>
        </div>
      )}
      {/* Player row */}
      <div className="flex items-center gap-2 w-full">
        {showAvatars && leftAvatarUrl && (
          <div className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden flex-shrink-0 bg-ancient-input-bg border border-ancient-border-stone">
            <Image src={leftAvatarUrl} alt="avatar" fill className="object-cover" sizes="36px" />
          </div>
        )}

        <button
          type="button"
          onClick={togglePlay}
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer z-10 text-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isIncoming
            ? "bg-ancient-icon-glow text-ancient-bg-dark hover:bg-green-500 focus:ring-ancient-icon-glow"
            : "bg-ancient-bg-dark text-ancient-icon-glow hover:bg-ancient-input-bg focus:ring-ancient-bubble-other"
            }`}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
          disabled={hasError}
        >
          {isPlaying ? <FaPause /> : <FaPlay className="ml-0.5" />}
        </button>

        <div className="flex-1 flex flex-col justify-center min-w-0 overflow-visible">
          {/* Waveform */}
          <div className="overflow-visible">
            <AnimatedWave isPlaying={isPlaying} progress={progress} />
          </div>
          {/* Time stamps */}
          <div className={`flex justify-between text-[10px] pt-0.5 ${isIncoming ? "text-ancient-text-muted" : "text-ancient-text-muted/80"}`}>
            <span className="tabular-nums">{formatDuration(current)}</span>
            <span className="font-medium tabular-nums">{formatDuration(duration)}</span>
          </div>
          {hasError && (
            <div className="text-red-400 text-[10px] mt-0.5 italic">
              Failed to play audio
            </div>
          )}
        </div>


        {showAvatars && rightAvatarUrl && (
          <div className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden flex-shrink-0 bg-ancient-input-bg border border-ancient-icon-glow">
            <Image src={rightAvatarUrl} alt="avatar" fill className="object-cover" sizes="36px" />
          </div>
        )}
      </div>  {/* end player row */}
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" src={src} className="sr-only">
        <source src={src} type="audio/webm" />
        <source src={src} type="audio/ogg" />
        <source src={src} type="audio/mpeg" />
        <source src={src} type="audio/mp4" />
        <source src={src} type="audio/wav" />
      </audio>
    </div>
  );
}
