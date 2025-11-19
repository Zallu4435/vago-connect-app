"use client";
import React from "react";
import Link from "next/link";

function FullPageError({
  title = "Something went wrong",
  message = "An unexpected error occurred.",
  actionHref = "/",
  actionLabel = "Go Home",
  onRetry,
  retryLabel = "Try Again",
}) {
  return (
    <div className="h-screen w-screen bg-ancient-bg-dark text-ancient-text-light flex flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-4 bg-ancient-bg-medium/90 rounded-2xl shadow-lg border border-ancient-border-stone p-8">
        <h1 className="text-3xl font-semibold text-ancient-icon-glow drop-shadow">{title}</h1>
        <p className="text-base text-ancient-text-muted">{message}</p>
        <div className="pt-4 flex items-center justify-center gap-3">
          {typeof onRetry === "function" && (
            <button
              type="button"
              onClick={onRetry}
              className="bg-ancient-bubble-user hover:bg-ancient-bubble-user-light text-ancient-text-light px-5 py-2 rounded-lg shadow transition-colors"
            >
              {retryLabel}
            </button>
          )}
          <Link
            href={actionHref}
            className="bg-ancient-icon-glow/80 hover:bg-ancient-icon-glow text-ancient-bg-dark px-5 py-2 rounded-lg shadow transition-colors"
          >
            {actionLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FullPageError;
