"use client";
import React from "react";

export default function AnimatedWave({ isPlaying, progress = 0 }) {
  return (
    <div className="relative flex-1 h-6 sm:h-8 overflow-hidden flex items-center rounded-full">
      {/* Background for the played portion */}
      <div
        className="absolute inset-0 bg-ancient-icon-glow/20 rounded-full"
        style={{ width: `${progress}%` }}
      ></div>

      {/* Animated wave lines */}
      <div className={`
        relative flex items-center justify-between w-full h-full px-0.5 sm:px-1
        ${isPlaying ? "animate-pulse-waves" : ""}
      `}>
        {Array.from({ length: 25 }).map((_, i) => {
          // Random heights for animation between 6 and 24 on desktop, slightly smaller on mobile
          const minHeight = 6;
          const maxHeight = 24;
          const height = isPlaying
            ? Math.max(minHeight, Math.random() * maxHeight)
            : minHeight;
          return (
            <div
              key={i}
              className="w-0.5 rounded-full transition-all duration-100 ease-in-out"
              style={{
                height: `${height}px`,
                minHeight: `${minHeight}px`,
                backgroundColor: isPlaying
                  ? "var(--ancient-icon-glow)"
                  : "var(--ancient-text-muted)",
                animationDelay: `${i * 0.05}s`,
                transition: "height 0.1s, background-color 0.3s",
              }}
            ></div>
          );
        })}
      </div>

      {/* Overlay to dim unplayed portion of the wave */}
      <div
        className="absolute inset-0 bg-ancient-bg-dark/50 rounded-full"
        style={{ left: `${progress}%` }}
      ></div>
    </div>
  );
}
