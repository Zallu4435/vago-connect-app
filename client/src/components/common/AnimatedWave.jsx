"use client";
import React, { useMemo } from "react";

export default function AnimatedWave({ isPlaying, progress = 0 }) {
  // Generate 30 random heights once per mount
  const staticHeights = useMemo(() => Array.from({ length: 30 }, () => 0.2 + Math.random() * 0.8), []);

  return (
    <div className="relative flex-1 h-6 sm:h-8 flex items-center justify-between gap-[2px] w-full max-w-[150px] sm:max-w-[180px]">
      {staticHeights.map((h, i) => {
        const isPlayed = (i / 30) * 100 <= progress;
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
  );
}
