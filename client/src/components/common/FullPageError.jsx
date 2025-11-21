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
    <div className="min-h-screen w-full bg-ancient-bg-dark text-ancient-text-light flex flex-col items-center justify-center px-4 sm:px-8 py-10">
      <div className="
        max-w-lg w-full space-y-6
        bg-ancient-bg-medium/90 rounded-2xl shadow-lg border border-ancient-border-stone
        p-6 sm:p-8
        text-center
      ">
        <h1 className="
          text-2xl sm:text-3xl font-semibold text-ancient-icon-glow drop-shadow
          truncate
        ">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-ancient-text-muted">
          {message}
        </p>
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          {typeof onRetry === "function" && (
            <button
              type="button"
              onClick={onRetry}
              className="
                w-full sm:w-auto
                bg-ancient-bubble-user hover:bg-ancient-bubble-user-light
                text-ancient-text-light px-5 py-2 rounded-lg shadow
                transition-colors text-base sm:text-lg
              "
            >
              {retryLabel}
            </button>
          )}
          <Link
            href={actionHref}
            className="
              w-full sm:w-auto
              bg-ancient-icon-glow/80 hover:bg-ancient-icon-glow
              text-ancient-bg-dark px-5 py-2 rounded-lg shadow
              transition-colors text-base sm:text-lg
              text-center
            "
          >
            {actionLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FullPageError;
