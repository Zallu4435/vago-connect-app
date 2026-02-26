"use client";
import React from "react";
import { IoWarning, IoAlertCircle, IoInformationCircle } from "react-icons/io5";
import ModalShell from "@/components/common/ModalShell";
import Button from "@/components/common/Button";

const VARIANT_MAP = {
  danger: {
    bgHeader: "bg-red-900/30",
    borderHeader: "border-red-800/60",
    iconClass: "text-red-400",
    variantKey: "danger",
    icon: IoAlertCircle,
  },
  warning: {
    bgHeader: "bg-yellow-900/30",
    borderHeader: "border-yellow-800/60",
    iconClass: "text-yellow-400",
    variantKey: "warning",
    icon: IoWarning,
  },
  info: {
    bgHeader: "bg-blue-900/30",
    borderHeader: "border-blue-800/60",
    iconClass: "text-blue-400",
    variantKey: "info",
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
        <Button
          onClick={onClose}
          disabled={confirmLoading}
          variant="ghost"
          className="w-full xs:w-auto border border-ancient-input-border"
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          isLoading={confirmLoading}
          variant={v.variantKey}
          className={`w-full xs:w-auto shadow-md ${v.variantKey === 'danger' ? 'bg-red-600 text-white hover:bg-red-500 border-none' : ''}`}
        >
          {confirmText}
        </Button>
      </div>
    </ModalShell>
  );
}
