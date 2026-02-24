"use client";
import React from "react";
import { IoWarning, IoAlertCircle, IoInformationCircle } from "react-icons/io5";
import ModalShell from "@/components/common/ModalShell";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const VARIANT_MAP = {
  danger: {
    bgHeader: "bg-red-900/30",
    borderHeader: "border-red-800/60",
    iconClass: "text-red-400",
    confirmClass: "bg-red-600 hover:bg-red-500 text-white",
    icon: IoAlertCircle,
  },
  warning: {
    bgHeader: "bg-yellow-900/30",
    borderHeader: "border-yellow-800/60",
    iconClass: "text-yellow-400",
    confirmClass: "bg-yellow-500 hover:bg-yellow-400 text-ancient-bg-dark",
    icon: IoWarning,
  },
  info: {
    bgHeader: "bg-blue-900/30",
    borderHeader: "border-blue-800/60",
    iconClass: "text-blue-400",
    confirmClass: "bg-blue-600 hover:bg-blue-500 text-white",
    icon: IoInformationCircle,
  },
};

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmLoading = false,
  variant = "danger",
  extra,
}) {
  const v = VARIANT_MAP[variant] || VARIANT_MAP.danger;
  const Icon = v.icon;

  return (
    <ModalShell open={open} onClose={onClose} maxWidth="max-w-xs sm:max-w-sm">
      {/* Header */}
      <div className={`
        flex items-center gap-2 sm:gap-3 
        p-3 sm:p-4 border-b ${v.bgHeader} ${v.borderHeader}
      `}>
        <Icon className={`${v.iconClass} text-xl sm:text-2xl`} />
        <h3 className="text-ancient-text-light text-base sm:text-lg font-bold">{title}</h3>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 text-ancient-text-muted text-sm sm:text-base leading-relaxed">
        {description}
      </div>

      {extra ? (
        <div className="px-4 sm:px-5 pb-2">
          {extra}
        </div>
      ) : null}

      {/* Footer */}
      <div className="
        flex flex-col xs:flex-row justify-end gap-2
        p-3 sm:p-4 bg-ancient-bg-medium border-t border-ancient-border-stone
      ">
        <button
          onClick={onClose}
          disabled={confirmLoading}
          className="
            px-3 sm:px-4 py-2 rounded-lg border border-ancient-input-border 
            text-ancient-text-light hover:bg-ancient-input-bg transition-colors
            w-full xs:w-auto
          "
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={confirmLoading}
          className={`
            px-3 sm:px-4 py-2 rounded-lg font-bold shadow-md transition-colors
            ${v.confirmClass} disabled:opacity-60 disabled:cursor-not-allowed
            w-full xs:w-auto flex items-center justify-center
          `}
        >
          {confirmLoading ? (
            <LoadingSpinner size={20} label="Processing..." />
          ) : (
            confirmText
          )}
        </button>
      </div>
    </ModalShell>
  );
}
