"use client";
import React from "react";

function ErrorMessage({ message = "Something went wrong.", className = "" }) {
  return (
    <div
      className={`px-4 py-2 rounded-lg bg-ancient-danger-bg/90 text-ancient-text-light shadow-inner font-semibold ${className}`}
      role="alert"
    >
      <span className="text-ancient-icon-glow">{message}</span>
    </div>
  );
}

export default ErrorMessage;
