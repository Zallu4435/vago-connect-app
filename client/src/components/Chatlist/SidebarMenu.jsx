"use client";
import React, { useEffect } from "react";
import Avatar from "../common/Avatar";
import { getAbsoluteUrl } from "@/lib/url";
import { IoSettingsOutline, IoLogOutOutline } from "react-icons/io5";
import { GiCrystalBall, GiMagicLamp, GiMoon } from "react-icons/gi";

export default function SidebarMenu({
  open, onClose, user,
  onNewGroup, onProfile, onCalls, onSettings, onLogout,
  isLoggingOut = false,
}) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-label="Close sidebar"
        tabIndex={-1}
      />

      {/* Panel */}
      <aside
        className="
          absolute left-0 top-0 h-full w-[94vw] max-w-[340px] sm:w-[340px]
          bg-ancient-bg-dark border-r border-ancient-border-stone shadow-2xl
          animate-slide-in flex flex-col
          transition-all ease-in-out
        "
        style={{ maxHeight: "100svh", paddingBottom: "env(safe-area-inset-bottom,0px)" }}
        tabIndex={0}
        aria-modal="true"
        role="dialog"
      >
        {/* Header / Profile */}
        <div className="p-5 sm:p-6 bg-ancient-bg-medium border-b border-ancient-border-stone flex flex-col items-center">
          <Avatar type="lg" image={getAbsoluteUrl(user?.profileImage || user?.image)} />
          <div className="flex flex-col items-center mt-3">
            <span className="text-ancient-text-light font-bold text-base sm:text-lg">{user?.name || "User"}</span>
            <span className="text-ancient-text-muted text-xs sm:text-sm text-center">{user?.email || "unknown@example.com"}</span>
          </div>
        </div>

        {/* Nav actions */}
        <nav className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-1">
          <button
            className="flex items-center gap-4 px-4 py-3 text-ancient-text-light hover:bg-ancient-input-bg rounded-lg transition-colors duration-200"
            onClick={onProfile}
          >
            <GiCrystalBall className="text-ancient-icon-glow text-xl sm:text-2xl" />
            <span className="text-sm sm:text-base font-medium">Profile</span>
          </button>
          <button
            className="flex items-center gap-4 px-4 py-3 text-ancient-text-light hover:bg-ancient-input-bg rounded-lg transition-colors duration-200"
            onClick={onNewGroup}
          >
            <GiMoon className="text-ancient-icon-glow text-xl sm:text-2xl" />
            <span className="text-sm sm:text-base font-medium">New Group</span>
          </button>
          <button
            className="flex items-center gap-4 px-4 py-3 text-ancient-text-light hover:bg-ancient-input-bg rounded-lg transition-colors duration-200"
            onClick={onCalls}
          >
            <GiMagicLamp className="text-ancient-icon-glow text-xl sm:text-2xl" />
            <span className="text-sm sm:text-base font-medium">Calls</span>
          </button>
          <button
            className="flex items-center gap-4 px-4 py-3 text-ancient-text-light hover:bg-ancient-input-bg rounded-lg transition-colors duration-200"
            onClick={onSettings}
          >
            <IoSettingsOutline className="text-ancient-icon-glow text-xl sm:text-2xl" />
            <span className="text-sm sm:text-base font-medium">Settings</span>
          </button>

          {/* ── Logout ── */}
          <button
            className={`
              flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 mt-3 sm:mt-4
              ${isLoggingOut
                ? "opacity-70 cursor-not-allowed bg-red-700/10"
                : "text-ancient-warning-text hover:bg-red-700/20 cursor-pointer"}
            `}
            onClick={isLoggingOut ? undefined : onLogout}
            disabled={isLoggingOut}
            aria-label={isLoggingOut ? "Logging out…" : "Logout"}
            aria-busy={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                {/* Spinner */}
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-ancient-warning-text border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span className="text-sm sm:text-base font-medium text-ancient-warning-text">
                  Logging out…
                </span>
              </>
            ) : (
              <>
                <IoLogOutOutline className="text-ancient-warning-text text-xl sm:text-2xl" />
                <span className="text-sm sm:text-base font-medium">Logout</span>
              </>
            )}
          </button>
        </nav>
      </aside>
    </div>
  );
}
