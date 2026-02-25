"use client";
import React, { useEffect, useRef, useState } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { createPortal } from "react-dom";
import { useModalLock } from "@/hooks/useModalLock";

const getModalPortalRoot = () => {
  if (typeof document === 'undefined') return null;
  let root = document.getElementById('modal-portal');
  if (!root) {
    root = document.createElement('div');
    root.id = 'modal-portal';
    document.body.appendChild(root);
  }
  return root;
};

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

  useEffect(() => {
    setPortalRoot(getModalPortalRoot());
  }, []);

  useClickOutside(open, onClose, [ref]);
  useModalLock(open);

  if (!open || !portalRoot) return null;

  return createPortal(
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
    </div>,
    portalRoot
  );
}
