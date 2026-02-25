"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Avatar from "../common/Avatar";
import { getAbsoluteUrl } from "@/lib/url";
import { IoLogOutOutline } from "react-icons/io5";
import { GiCrystalBall, GiMagicLamp, GiMoon } from "react-icons/gi";

export default function SidebarMenu({
  open, onClose, user,
  onNewGroup, onProfile, onCalls, onLogout,
  isLoggingOut = false,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const panel = (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop — covers full viewport, blocks interaction with chat */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-label="Close menu"
        tabIndex={-1}
      />

      {/* Slide-in panel */}
      <aside
        className="
          absolute left-0 top-0 h-full w-[82vw] max-w-[320px] sm:max-w-[340px]
          bg-ancient-bg-dark border-r border-ancient-border-stone shadow-2xl
          flex flex-col animate-slide-in
        "
        style={{ maxHeight: "100svh", paddingBottom: "env(safe-area-inset-bottom,0px)" }}
        tabIndex={0}
        aria-modal="true"
        role="dialog"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-ancient-bg-medium border-b border-ancient-border-stone flex flex-col items-center">
          <Avatar type="lg" image={getAbsoluteUrl(user?.profileImage || user?.image)} />
          <div className="flex flex-col items-center mt-3">
            <span className="text-ancient-text-light font-bold text-base sm:text-lg">{user?.name || "User"}</span>
            <span className="text-ancient-text-muted text-xs sm:text-sm text-center">{user?.email || "unknown@example.com"}</span>
          </div>
        </div>

        {/* Nav */}
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

          {/* Logout */}
          <div className="mt-4 pt-4 border-t border-ancient-border-stone/40">
            <button
              className={`
                w-full flex items-center gap-4 px-4 py-3 rounded-xl
                border transition-all duration-200
                ${isLoggingOut
                  ? "opacity-60 cursor-not-allowed border-red-800/40 bg-red-900/15"
                  : "border-red-700/50 bg-red-900/10 hover:bg-red-800/25 hover:border-red-600/70 cursor-pointer active:scale-[0.98]"}
              `}
              onClick={isLoggingOut ? undefined : onLogout}
              disabled={isLoggingOut}
              aria-label={isLoggingOut ? "Logging out…" : "Logout"}
              aria-busy={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span className="text-sm sm:text-base font-semibold text-red-400">Logging out…</span>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-lg bg-red-700/30 flex items-center justify-center flex-shrink-0">
                    <IoLogOutOutline className="text-red-400 text-lg" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-red-400">Logout</span>
                </>
              )}
            </button>
          </div>

        </nav>
      </aside >
    </div >
  );

  return createPortal(panel, document.body);
}
