"use client";
import React from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import LoadingSpinner from "./LoadingSpinner";

export default function InlineEditor({
  value,
  onChange,
  onSave,
  onCancel,
  placeholder = "Edit...",
  autoFocus = true,
  inputClassName = "",
  containerClassName = "",
  isSaving = false,
}) {
  return (
    <div className={`bg-ancient-bg-medium border border-ancient-border-stone rounded-lg p-2 flex items-center gap-2 shadow-xl animate-fade-in-up origin-bottom ${containerClassName}`}>
      <input
        className={`bg-ancient-input-bg outline-none text-ancient-text-light text-sm border border-ancient-border-stone rounded px-3 py-1 min-w-[150px] ${inputClassName} disabled:opacity-50`}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isSaving) onSave?.();
          if (e.key === "Escape" && !isSaving) onCancel?.();
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={isSaving}
      />
      {isSaving ? (
        <LoadingSpinner size={16} label="" className="bg-transparent shadow-none p-0 px-1" />
      ) : (
        <>
          <button
            className="text-ancient-icon-glow hover:text-green-400 transition-colors duration-200 disabled:opacity-50"
            onClick={onSave}
            title="Save"
            disabled={isSaving}
          >
            <FaCheck className="text-lg" />
          </button>
          <button
            className="text-ancient-text-muted hover:text-ancient-text-light transition-colors duration-200 disabled:opacity-50"
            onClick={onCancel}
            title="Cancel"
            disabled={isSaving}
          >
            <FaTimes className="text-lg" />
          </button>
        </>
      )}
    </div>
  );
}
