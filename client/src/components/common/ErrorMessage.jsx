"use client";
import React from "react";

function ErrorMessage({ message = "Something went wrong.", className = "" }) {
  return (
    <div className={`text-red-400 text-sm ${className}`} role="alert">
      {message}
    </div>
  );
}

export default ErrorMessage;
