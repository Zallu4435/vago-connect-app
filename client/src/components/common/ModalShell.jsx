"use client";
import React, { useEffect, useRef } from "react";

export default function ModalShell({
  open,
  onClose,
  children,
  maxWidth = "max-w-lg",
  className = "",
  ariaLabel,
  ariaLabelledby
}) {
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
      setTimeout(() => {
        try { ref.current?.focus?.(); } catch {}
      }, 0);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="
      fixed inset-0 z-50 flex items-center justify-center
      p-2 sm:p-4 bg-black/70 backdrop-blur-sm
      animate-fade-in
    ">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        tabIndex={-1}
        className={`
          relative 
          bg-ancient-bg-dark 
          rounded-xl sm:rounded-2xl
          w-full ${maxWidth}
          max-w-[97vw] max-h-[97vh]
          shadow-2xl border border-ancient-border-stone
          animate-zoom-in overflow-hidden
          focus:outline-none outline-none
          ${className}
        `}
        style={{
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    </div>
  );
}
