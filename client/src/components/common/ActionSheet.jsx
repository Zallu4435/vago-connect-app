"use client";
import React, { useEffect, useRef, useState } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { usePopoverPosition } from "@/hooks/usePopoverPosition";
import { createPortal } from "react-dom";

// Create or get portal root
const getPortalRoot = () => {
  if (typeof document === 'undefined') return null;

  let portalRoot = document.getElementById('action-sheet-portal');
  if (!portalRoot) {
    portalRoot = document.createElement('div');
    portalRoot.id = 'action-sheet-portal';
    document.body.appendChild(portalRoot);
  }
  return portalRoot;
};

export default function ActionSheet({
  open,
  onClose,
  items = [],
  align = "right",
  placement = "bottom",
  className = "",
  style = {},
  anchorRef,
}) {
  const ref = useRef(null);
  const [portalRoot, setPortalRoot] = useState(null);

  // Initialize portal root
  useEffect(() => {
    setPortalRoot(getPortalRoot());
  }, []);

  // Click and escape to dismiss, responsive for mobile/touch too
  useClickOutside(open, onClose, [ref, anchorRef]);

  // Use Custom Positioning Hook
  const coords = usePopoverPosition({
    open,
    anchorRef,
    popoverRef: ref,
    placement,
    align,
    gap: 8
  });

  if (!open || !portalRoot) return null;

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

  return createPortal(menu, portalRoot);
}
