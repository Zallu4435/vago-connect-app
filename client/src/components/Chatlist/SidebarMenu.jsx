"use client";
import React, { useEffect } from "react";
import Avatar from "../common/Avatar"; // Assuming Avatar component is already themed
import { getAbsoluteUrl } from "@/lib/url";
import { IoSettingsOutline, IoLogOutOutline } from "react-icons/io5"; // Keep some Io5
import { GiCrystalBall, GiMagicLamp, GiMoon } from "react-icons/gi"; // Mystical icons (trimmed to used ones)

export default function SidebarMenu({ open, onClose, user, onNewGroup, onProfile, onCalls, onSettings, onLogout }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Panel */}
      <div className="absolute left-0 top-0 h-full w-[340px] max-w-[90vw] bg-ancient-bg-dark border-r border-ancient-border-stone shadow-2xl animate-slide-in">
        {/* Header/Profile */}
        <div className="p-6 bg-ancient-bg-medium border-b border-ancient-border-stone flex flex-col items-center justify-center">
          <Avatar type="lg" image={getAbsoluteUrl(user?.profileImage || user?.image)} /> {/* Larger avatar */}
          <div className="flex flex-col items-center mt-3">
            <span className="text-ancient-text-light font-bold text-lg">{user?.name || "User"}</span>
            <span className="text-ancient-text-muted text-sm">{user?.email || "unknown@example.com"}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 flex flex-col gap-1">
          {/* Profile */}
          <button
            className="flex items-center gap-4 px-4 py-3 text-ancient-text-light hover:bg-ancient-input-bg rounded-lg transition-colors duration-200"
            onClick={onProfile}
          >
            <GiCrystalBall className="text-ancient-icon-glow text-2xl" />
            <span className="text-base font-medium">Profile</span>
          </button>

          {/* New Group */}
          <button
            className="flex items-center gap-4 px-4 py-3 text-ancient-text-light hover:bg-ancient-input-bg rounded-lg transition-colors duration-200"
            onClick={onNewGroup}
          >
            <GiMoon className="text-ancient-icon-glow text-2xl" />
            <span className="text-base font-medium">New Group</span>
          </button>

          {/* Calls */}
          <button
            className="flex items-center gap-4 px-4 py-3 text-ancient-text-light hover:bg-ancient-input-bg rounded-lg transition-colors duration-200"
            onClick={onCalls}
          >
            <GiMagicLamp className="text-ancient-icon-glow text-2xl" />
            <span className="text-base font-medium">Calls</span>
          </button>

          {/* Settings */}
          <button
            className="flex items-center gap-4 px-4 py-3 text-ancient-text-light hover:bg-ancient-input-bg rounded-lg transition-colors duration-200"
            onClick={onSettings}
          >
            <IoSettingsOutline className="text-ancient-icon-glow text-2xl" />
            <span className="text-base font-medium">Settings</span>
          </button>

          {/* Logout */}
          <button
            className="flex items-center gap-4 px-4 py-3 text-ancient-warning-text hover:bg-red-700/20 rounded-lg transition-colors duration-200 mt-4"
            onClick={onLogout}
          >
            <IoLogOutOutline className="text-ancient-warning-text text-2xl" />
            <span className="text-base font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}