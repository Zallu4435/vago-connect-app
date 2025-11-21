"use client";
import React, { useEffect, useRef } from "react";

export default function ActionSheet({ open, onClose, items = [], align = "right", placement = "below", className = "", style = {} }) {
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    if (open) {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const alignClass = align === "left" ? (placement === "above" ? "left-0 origin-bottom-left" : "left-0 origin-top-left")
    : align === "center" ? (placement === "above" ? "left-1/2 -translate-x-1/2 origin-bottom" : "left-1/2 -translate-x-1/2 origin-top")
    : (placement === "above" ? "right-0 origin-bottom-right" : "right-0 origin-top-right");
  const placeClass = placement === "above" ? "bottom-full mb-2" : "top-full mt-2";

  return (
    <div
      ref={ref}
      className={`absolute ${placeClass} z-30 min-w-48 bg-ancient-bg-dark border border-ancient-border-stone rounded-xl shadow-xl p-2 animate-fade-in-down ${alignClass} ${className}`}
      style={style}
      role="menu"
   >
      {items.map((it, idx) => (
        <button
          key={idx}
          type="button"
          className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-md transition-colors duration-200 ${it.danger ? "text-ancient-warning-text hover:bg-ancient-bubble-user" : "text-ancient-text-light hover:bg-ancient-bubble-user"} ${it.disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          onClick={() => {
            if (it.disabled) return;
            it.onClick?.();
            onClose?.();
          }}
          disabled={it.disabled}
          role="menuitem"
        >
          {it.icon ? <it.icon className="text-lg text-ancient-icon-glow" /> : null}
          <span className="text-sm">{it.label}</span>
        </button>
      ))}
    </div>
  );
}
