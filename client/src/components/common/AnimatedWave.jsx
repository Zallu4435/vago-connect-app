"use client";
import React, { useMemo } from "react";

const BAR_COUNT = 40;
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const HEIGHT = 32;

/**
 * Professional voice message waveform — like WhatsApp / Telegram.
 *
 * Props:
 * - isPlaying: boolean (enables playback pulse animation)
 * - progress: 0–100 (controls fill for played vs unplayed bars)
 * - isLive: boolean (recording mode — all bars pulse, no progress fill)
 * - isIncoming: boolean (controls accent color for unplayed bars)
 */
export default function AnimatedWave({ isPlaying, progress = 0, isLive = false, isIncoming = false }) {
  const bars = useMemo(() => {
    const profile = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      const normalized = i / BAR_COUNT;
      const base = Math.sin(normalized * Math.PI * 3.2) * 0.35 + 0.5;
      const noise = (Math.sin(i * 7.3) * 0.5 + Math.cos(i * 3.7) * 0.3) * 0.2;
      profile.push(Math.max(0.08, Math.min(1, base + noise)));
    }
    return profile;
  }, []);

  const totalWidth = BAR_COUNT * (BAR_WIDTH + BAR_GAP) - BAR_GAP;
  const shouldAnimate = isPlaying || isLive;

  return (
    <div
      className="flex items-center"
      style={{ width: totalWidth, height: HEIGHT, minWidth: totalWidth, flexShrink: 0 }}
      aria-label={isLive ? "Recording waveform" : "Audio waveform"}
      role="img"
    >
      {bars.map((h, i) => {
        const barHeight = Math.round(h * HEIGHT);
        const isPlayed = !isLive && (i / BAR_COUNT) * 100 <= progress;
        const yOffset = Math.round((HEIGHT - barHeight) / 2);

        // Color logic:
        // Live recording: all bars pulse in accent green
        // Played portion: glowing green
        // Unplayed: muted white (incoming) or muted green-white (outgoing)
        const bgColor = isLive || isPlayed
          ? "var(--ancient-icon-glow, #4ade80)"
          : isIncoming
            ? "rgba(255,255,255,0.28)"
            : "rgba(255,255,255,0.22)";

        return (
          <div
            key={i}
            style={{
              width: BAR_WIDTH,
              height: barHeight,
              marginRight: i < BAR_COUNT - 1 ? BAR_GAP : 0,
              marginTop: yOffset,
              borderRadius: BAR_WIDTH,
              flexShrink: 0,
              backgroundColor: bgColor,
              animationName: shouldAnimate ? "voice-bar-pulse" : "none",
              animationDuration: shouldAnimate ? `${0.45 + (i % 6) * 0.07}s` : "0s",
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              animationDirection: "alternate",
              animationDelay: shouldAnimate ? `${(i % 9) * 0.055}s` : "0s",
              transition: "background-color 0.12s ease",
              transformOrigin: "center",
            }}
          />
        );
      })}

      <style>{`
        @keyframes voice-bar-pulse {
          0%   { transform: scaleY(0.55); opacity: 0.8; }
          100% { transform: scaleY(1.1);  opacity: 1; }
        }
      `}</style>
    </div>
  );
}
