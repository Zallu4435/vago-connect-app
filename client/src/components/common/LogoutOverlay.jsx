"use client";
import React from "react";
import { IoLogOutOutline } from "react-icons/io5";

/**
 * Full-screen overlay shown during the logout transition.
 * Fades in over the app so users see feedback instead of a blank flash.
 */
export default function LogoutOverlay({ visible }) {
    if (!visible) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-ancient-bg-dark/95 backdrop-blur-sm animate-fade-in"
            role="status"
            aria-live="polite"
            aria-label="Logging out"
        >
            {/* Icon */}
            <div className="relative mb-5">
                <div className="w-20 h-20 rounded-full bg-ancient-input-bg border border-ancient-border-stone flex items-center justify-center shadow-2xl">
                    <IoLogOutOutline className="text-4xl text-ancient-warning-text" />
                </div>
                {/* Spinning ring */}
                <div className="absolute inset-0 rounded-full border-2 border-ancient-warning-text/30 border-t-ancient-warning-text animate-spin" />
            </div>

            {/* Text */}
            <p className="text-ancient-text-light text-base font-semibold tracking-wide">
                Signing out…
            </p>
            <p className="text-ancient-text-muted text-sm mt-1">
                See you next time
            </p>
        </div>
    );
}
