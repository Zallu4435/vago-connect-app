"use client";
import React from "react";

function LoadingSpinner({ label = "Loading...", className = "", size = 20 }) {
  return (
    <div
      className={`
        flex items-center justify-center gap-2 sm:gap-3 
        px-3 sm:px-4 py-2 sm:py-2.5
        rounded-lg bg-ancient-bg-medium/80 
        text-ancient-icon-glow shadow-inner
        w-fit max-w-full
        ${className}
      `}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <svg
        className="animate-spin text-ancient-icon-glow flex-shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        style={{
          width: typeof size === 'number' ? `${Math.max(16, size)}px` : size,
          height: typeof size === 'number' ? `${Math.max(16, size)}px` : size
        }}
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <span className="text-xs sm:text-sm font-medium text-ancient-text-light drop-shadow truncate">
        {label}
      </span>
    </div>
  );
}

export default LoadingSpinner;
