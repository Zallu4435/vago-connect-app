"use client";
import React, { useState, useRef, useEffect } from "react";
import { usePopoverPosition } from '@/hooks/ui/usePopoverPosition';
import { useClickOutside } from '@/hooks/ui/useClickOutside';
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { getPortalRoot } from "@/utils/domHelpers";
import { MdAdd } from "react-icons/md";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false, loading: () => null });


export default function ReactionPicker({
  open,
  onClose,
  anchorSide = "right", // "left" | "right"
  onPick,
  emojis = ["👍", "❤️", "😂", "😮", "😢", "👏"], // Reduced default emojis like WhatsApp
  className = "",
  containerClassName = "",
  toggleRef,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [portalRoot, setPortalRoot] = useState(null);
  const plusButtonRef = useRef(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    setPortalRoot(getPortalRoot("emoji-picker-portal"));
  }, []);
  const coords = usePopoverPosition({
    open: showPicker,
    anchorRef: plusButtonRef,
    popoverRef: pickerRef,
    placement: 'top',
    gap: 12
  });

  const containerRef = useRef(null);

  useClickOutside(showPicker, () => setShowPicker(false), [pickerRef, plusButtonRef]);
  useClickOutside(open, onClose, [containerRef, toggleRef, pickerRef]);

  if (!open) return null;

  const dynamicPickerPortal = showPicker && portalRoot ? createPortal(
    <div
      ref={pickerRef}
      className="fixed z-[10000] shadow-2xl rounded-xl overflow-hidden animate-fade-in-up"
      style={{ top: coords.top, left: coords.left, visibility: coords.visibility }}
      role="dialog"
      aria-label="Emoji picker"
    >
      <EmojiPicker
        theme="dark"
        onEmojiClick={(emojiData) => {
          onPick?.(emojiData.emoji);
          setShowPicker(false);
        }}
        searchDisabled={false}
        skinTonesDisabled
      />
    </div>,
    portalRoot
  ) : null;

  return (
    <div
      ref={containerRef}
      className={`
        absolute ${anchorSide === "left" ? "left-0" : "right-0"} bottom-full mb-2 z-30
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

      {/* Dynamic Emoji Picker Button */}
      <button
        ref={plusButtonRef}
        className={`
          p-2 sm:p-2.5 text-lg sm:text-xl
          hover:bg-ancient-bubble-user active:bg-ancient-bubble-user-light
          rounded-full transition-colors duration-150
          focus:outline-2 focus:outline-ancient-icon-glow flex items-center justify-center
          text-ancient-text-muted hover:text-white
          ${className}
        `}
        onClick={() => setShowPicker(!showPicker)}
        aria-label="Trigger full emoji picker"
        type="button"
      >
        <MdAdd />
      </button>

      {dynamicPickerPortal}
    </div>
  );
}
