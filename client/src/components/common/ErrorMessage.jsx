"use client";
import React from "react";

function ErrorMessage({ message = "Something went wrong.", className = "" }) {
  return (
    <div
      className={`
        px-3 sm:px-4 py-2 sm:py-3 rounded-lg
        bg-ancient-danger-bg/90 text-ancient-text-light
        shadow-inner font-semibold
        max-w-full max-w-xs sm:max-w-sm
        text-sm sm:text-base
        ${className}
      `}
      role="alert"
    >
      <span className="text-ancient-icon-glow break-words leading-snug">
        {message}
      </span>
    </div>
  );
}

export default ErrorMessage;
