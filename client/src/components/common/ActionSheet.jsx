"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function ActionSheet({
  open,
  onClose,
  items = [],
  align = "right",
  placement = "below",
  className = "",
  style = {},
  anchorRef,
}) {
  const ref = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, visibility: "hidden" });

  // Click and escape to dismiss, responsive for mobile/touch too
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
      document.addEventListener("touchstart", onDocClick, { passive: true });
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("touchstart", onDocClick);
    };
  }, [open, onClose]);

  // Responsive positioning clamps so sheet is always in-bounds
  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      const anchor = anchorRef?.current;
      const sheet = ref.current;
      if (!anchor || !sheet) return;
      const rect = anchor.getBoundingClientRect();
      const sheetRect = sheet.getBoundingClientRect();
      let left = rect.left;
      if (align === "center") left = rect.left + rect.width / 2 - sheetRect.width / 2;
      else if (align === "right") left = rect.right - sheetRect.width;
      left = Math.max(8, Math.min(left, window.innerWidth - sheetRect.width - 8));
      const gap = 8;
      let top = placement === "above" ? rect.top - sheetRect.height - gap : rect.bottom + gap;
      top = Math.max(8, Math.min(top, window.innerHeight - sheetRect.height - 8));
      setCoords({ top, left, visibility: "visible" });
    };
    setCoords((c) => ({ ...c, visibility: "hidden" }));
    const id = requestAnimationFrame(position);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open, align, placement, anchorRef]);

  if (!open) return null;

  const menu = (
    <div
      ref={ref}
      className={`
        fixed z-50 bg-ancient-bg-dark border border-ancient-border-stone
        rounded-xl shadow-xl
        p-1 sm:p-2
        min-w-[64vw] max-w-[94vw] sm:min-w-[14rem] sm:max-w-[20rem]
        animate-fade-in-down
        ${className}
      `}
      style={{ top: coords.top, left: coords.left, visibility: coords.visibility, ...style }}
      role="menu"
      tabIndex={-1}
    >
      {items.map((it, idx) => (
        <button
          key={idx}
          type="button"
          className={`
            flex items-center gap-2 sm:gap-3 w-full text-left 
            px-3 sm:px-4 py-2 sm:py-3 rounded-md 
            transition-colors duration-200
            ${it.danger ? "text-ancient-warning-text hover:bg-ancient-bubble-user" : "text-ancient-text-light hover:bg-ancient-bubble-user"}
            ${it.disabled ? "opacity-60 cursor-not-allowed" : ""}
            text-base sm:text-sm
          `}
          onClick={() => {
            if (it.disabled) return;
            it.onClick?.();
            onClose?.();
          }}
          disabled={it.disabled}
          role="menuitem"
        >
          {it.icon ? <it.icon className="text-lg sm:text-xl text-ancient-icon-glow flex-shrink-0" /> : null}
          <span className="truncate">{it.label}</span>
        </button>
      ))}
    </div>
  );

  return createPortal(menu, document.body);
}
