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
    <div className="h-screen w-screen bg-panel-header-background text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-lg space-y-4">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="text-secondary">{message}</p>
        <div className="pt-4 flex items-center justify-center gap-3">
          {typeof onRetry === "function" && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-block bg-search-input-container-background hover:bg-[#2b3942] px-5 py-2 rounded-lg"
            >
              {retryLabel}
            </button>
          )}
          <Link href={actionHref} className="inline-block bg-teal-600 hover:bg-teal-500 px-5 py-2 rounded-lg">
            {actionLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FullPageError;
