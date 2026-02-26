"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useModalLock } from '@/hooks/ui/useModalLock';
import { useDelayUnmount } from '@/hooks/ui/useDelayUnmount';
import { useClickOutside } from '@/hooks/ui/useClickOutside';
import { getPortalRoot } from "@/utils/domHelpers";

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
  const [portalRoot, setPortalRoot] = useState(null);
  const portalVisible = useDelayUnmount(open, 200);

  useEffect(() => {
    setPortalRoot(getPortalRoot("modal-portal"));
  }, []);

  useClickOutside(open, onClose, [ref]);
  useModalLock(open);

  if (!portalVisible || !portalRoot) return null;

  const backdropAnim = open ? "animate-fade-in" : "animate-fade-out";
  const modalAnim = open ? "animate-zoom-in" : "animate-zoom-out";

  return createPortal(
    <div className={`
      fixed inset-0 z-50 flex items-center justify-center
      p-2 sm:p-4 bg-black/70 backdrop-blur-sm
      ${backdropAnim}
    `}>
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
          ${modalAnim} overflow-hidden
          focus:outline-none outline-none
          ${className}
        `}
        style={{
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    </div>,
    portalRoot
  );
}
