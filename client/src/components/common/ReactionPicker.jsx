"use client";
import React from "react";

export default function ReactionPicker({
  open,
  anchorSide = "right", // "left" | "right"
  onPick,
  emojis = ["👍", "❤️", "😂", "😮", "😢", "👏", "🔥", "✨", "🙏"],
  className = "",
  containerClassName = "",
}) {
  if (!open) return null;
  return (
    <div
      className={`absolute ${anchorSide === "left" ? "left-0" : "right-0"} bottom-full mb-1 z-30 rounded-full bg-ancient-bg-dark border border-ancient-border-stone p-1 flex gap-1 shadow-xl animate-fade-in-up origin-bottom ${containerClassName}`}
    >
      {emojis.map((e) => (
        <button
          key={e}
          className={`p-2 text-xl hover:bg-ancient-bubble-user rounded-full transition-colors duration-150 ${className}`}
          onClick={() => onPick?.(e)}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
