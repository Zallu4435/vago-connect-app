"use client";
import React from "react";

export default function ThemedInput({
  name,
  state,
  setState,
  label = false,
  placeholder,
  Icon,
  isEditable = true
}) {
  return (
    <div className="flex flex-col gap-1 w-full max-w-full relative">
      {/* Responsive, absolutely positioned label */}
      {label && (
        <label
          htmlFor={name}
          className="
            text-ancient-text-muted text-xs sm:text-sm px-1
            absolute left-3 -top-3 z-10 rounded-md
            bg-ancient-bg-medium
            pointer-events-none 
          "
        >
          {name}
        </label>
      )}
      <div
        className={`
          relative flex items-center gap-2 sm:gap-3
          bg-ancient-input-bg border rounded-lg
          px-3 sm:px-4 py-2.5 sm:py-3 w-full
          transition-all duration-300 shadow-inner
          ${isEditable
            ? 'border-ancient-input-border focus-within:border-ancient-icon-glow'
            : 'border-transparent cursor-default'
          }
        `}
      >
        {typeof Icon === 'function' ? (
          <Icon className="text-ancient-icon-inactive text-lg sm:text-xl flex-shrink-0" />
        ) : null}
        <input
          type="text"
          id={name}
          placeholder={placeholder || `Enter your ${String(name || '').toLowerCase()}...`}
          className={`
            flex-grow min-w-0
            bg-transparent outline-none text-ancient-text-light
            placeholder:text-ancient-text-muted text-base sm:text-lg
            ${!isEditable ? 'pointer-events-none select-none' : ''}
          `}
          value={state}
          onChange={(e) => isEditable && setState(e.target.value)}
          disabled={!isEditable}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
