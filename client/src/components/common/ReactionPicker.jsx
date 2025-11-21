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
      className={`
        absolute ${anchorSide === "left" ? "left-0" : "right-0"} bottom-full mb-1 z-30
        rounded-full bg-ancient-bg-dark border border-ancient-border-stone
        p-1 sm:p-1.5 flex gap-0.5 sm:gap-1 shadow-xl
        animate-fade-in-up origin-bottom
        ${containerClassName}
      `}
      role="menu"
      tabIndex={-1}
      aria-label="Pick a reaction"
    >
      {emojis.map((e) => (
        <button
          key={e}
          className={`
            p-2 sm:p-2.5 text-lg sm:text-xl
            hover:bg-ancient-bubble-user active:bg-ancient-bubble-user-light
            rounded-full transition-colors duration-150
            focus:outline-2 focus:outline-ancient-icon-glow
            ${className}
          `}
          onClick={() => onPick?.(e)}
          tabIndex={0}
          aria-label={`React with ${e}`}
          type="button"
        >
          {e}
        </button>
      ))}
    </div>
  );
}
