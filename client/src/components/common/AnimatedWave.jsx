"use client";
import React from "react";

export default function AnimatedWave({ isPlaying, progress = 0 }) {
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
              height: `${isPlaying ? Math.max(8, Math.random() * 24) : 8}px`,
              minHeight: '8px',
              backgroundColor: isPlaying ? 'var(--ancient-icon-glow)' : 'var(--ancient-text-muted)',
              transition: 'height 0.1s, background-color 0.3s',
              animationDelay: `${i * 0.05}s`,
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
}
