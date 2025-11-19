"use client";
import React from "react";

function LoadingSpinner({ label = "Loading...", className = "" }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 rounded-lg bg-ancient-bg-medium/80 text-ancient-icon-glow shadow-inner ${className}`}
      role="status"
      aria-live="polite"
    >
      <svg
        className="animate-spin h-5 w-5 text-ancient-icon-glow"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        ></path>
      </svg>
      <span className="text-sm font-medium text-ancient-text-light drop-shadow">{label}</span>
    </div>
  );
}

export default LoadingSpinner;
