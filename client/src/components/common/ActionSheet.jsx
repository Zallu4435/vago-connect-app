"use client";
import React, { useEffect, useRef, useState } from "react";
import { useClickOutside } from '@/hooks/ui/useClickOutside';
import { usePopoverPosition } from '@/hooks/ui/usePopoverPosition';
import { createPortal } from "react-dom";
import { useDelayUnmount } from '@/hooks/ui/useDelayUnmount';
import { getPortalRoot } from "@/utils/domHelpers";


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
  const portalVisible = useDelayUnmount(open, 200);

  // Initialize portal root
  useEffect(() => {
    setPortalRoot(getPortalRoot("action-sheet-portal"));
  }, []);

  // Click and escape to dismiss, responsive for mobile/touch too
  useClickOutside(open, onClose, [ref, anchorRef]);

  // Use Custom Positioning Hook 
  // We compute position as long as it's visible in the portal, even while closing
  const coords = usePopoverPosition({
    open: portalVisible,
    anchorRef,
    popoverRef: ref,
    placement,
    align,
    gap: 8
  });

  if (!portalVisible || !portalRoot) return null;

  const animClass = open ? "animate-zoom-in-fade-in" : "animate-zoom-out-fade-out";

  const menu = (
    <div
      ref={ref}
      className={`
        fixed z-[9999] bg-ancient-bg-dark border border-ancient-border-stone
        rounded-xl shadow-xl
        p-1 sm:p-2
        min-w-[12rem] max-w-[94vw] sm:min-w-[14rem] sm:max-w-[20rem]
        ${animClass}
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
