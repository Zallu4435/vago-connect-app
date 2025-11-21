"use client";
import React from "react";
import { FaCheck, FaTimes } from "react-icons/fa";

export default function InlineEditor({
  value,
  onChange,
  onSave,
  onCancel,
  placeholder = "Edit...",
  autoFocus = true,
  inputClassName = "",
  containerClassName = "",
}) {
  return (
    <div className={`bg-ancient-bg-medium border border-ancient-border-stone rounded-lg p-2 flex items-center gap-2 shadow-xl animate-fade-in-up origin-bottom ${containerClassName}`}>
      <input
        className={`bg-ancient-input-bg outline-none text-ancient-text-light text-sm border border-ancient-border-stone rounded px-3 py-1 min-w-[150px] ${inputClassName}`}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave?.();
          if (e.key === "Escape") onCancel?.();
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      <button
        className="text-ancient-icon-glow hover:text-green-400 transition-colors duration-200"
        onClick={onSave}
        title="Save"
      >
        <FaCheck className="text-lg" />
      </button>
      <button
        className="text-ancient-text-muted hover:text-ancient-text-light transition-colors duration-200"
        onClick={onCancel}
        title="Cancel"
      >
        <FaTimes className="text-lg" />
      </button>
    </div>
  );
}
