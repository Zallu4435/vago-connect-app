/**
 * AnimatedPanel
 *
 * A reusable wrapper providing consistent, directional slide animations for
 * panels and modals across the app.
 *
 * Props:
 *   open       {boolean}  — Whether the panel is showing (controls mount/unmount + animation).
 *   direction  {string}   — "left" | "right" | "up" | "down" (default: "left")
 *   children   {node}     — Content to render inside the panel.
 *   className  {string}   — Extra Tailwind classes for the inner panel.
 *   duration   {number}   — Animation duration in ms (default: 300).
 *
 * Usage examples:
 *   <AnimatedPanel open={open} direction="left">
 *     <ProfileView />
 *   </AnimatedPanel>
 *
 *   <AnimatedPanel open={open} direction="right" className="max-w-md">
 *     <SearchMessages />
 *   </AnimatedPanel>
 */

"use client";
import React, { useEffect, useRef, useState } from "react";

// Per-direction: enter keyframe class + exit keyframe class
const DIRECTION_CLASSES = {
    left: {
        enter: "animate-panel-in-left",
        exit: "animate-panel-out-left",
    },
    right: {
        enter: "animate-panel-in-right",
        exit: "animate-panel-out-right",
    },
    up: {
        enter: "animate-panel-in-up",
        exit: "animate-panel-out-up",
    },
    down: {
        enter: "animate-panel-in-down",
        exit: "animate-panel-out-down",
    },
};

export default function AnimatedPanel({
    open,
    direction = "left",
    children,
    className = "",
    duration = 300,
}) {
    // We keep the panel mounted slightly after close for the exit animation
    const [mounted, setMounted] = useState(open);
    const [animClass, setAnimClass] = useState(
        open ? DIRECTION_CLASSES[direction]?.enter ?? "" : ""
    );
    const timerRef = useRef(null);

    useEffect(() => {
        if (open) {
            // Mount immediately, play enter animation
            setMounted(true);
            // Tiny RAF delay so the enter class applies after paint
            requestAnimationFrame(() => {
                setAnimClass(DIRECTION_CLASSES[direction]?.enter ?? "");
            });
        } else {
            // Play exit animation, then unmount
            setAnimClass(DIRECTION_CLASSES[direction]?.exit ?? "");
            timerRef.current = setTimeout(() => setMounted(false), duration);
        }
        return () => clearTimeout(timerRef.current);
    }, [open, direction, duration]);

    if (!mounted) return null;

    return (
        <div
            className={`h-full w-full flex flex-col bg-ancient-bg-dark text-ancient-text-light overflow-hidden pointer-events-auto ${animClass} ${className}`}
            style={{ animationDuration: `${duration}ms` }}
        >
            {children}
        </div>
    );
}
