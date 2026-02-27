"use client";
import React from "react";
import { FaTrashAlt } from "react-icons/fa";
import ModalShell from "@/components/common/ModalShell";
import Button from "@/components/common/Button";

export default function DeleteMessageModal({
    open,
    onClose,
    title = "Delete Message",
    description,
    isDeletingForMe = false,
    isDeletingForEveryone = false,
    onDelete,
    showForEveryoneButton = false,
}) {
    if (!open) return null;

    const isAnyPending = isDeletingForMe || isDeletingForEveryone;

    return (
        <ModalShell open={open} onClose={isAnyPending ? () => { } : onClose} maxWidth="max-w-xs sm:max-w-sm">
            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b bg-red-900/30 border-red-800/60">
                <FaTrashAlt className="text-red-400 text-xl sm:text-2xl" />
                <h3 className="text-ancient-text-light text-base sm:text-lg font-bold">{title}</h3>
            </div>

            {description && (
                <div className="p-4 sm:p-5 text-ancient-text-muted text-sm sm:text-base leading-relaxed">
                    {description}
                </div>
            )}

            <div className="flex flex-col gap-2 p-3 sm:p-4 bg-ancient-bg-medium border-t border-ancient-border-stone">
                {showForEveryoneButton && (
                    <Button
                        onClick={() => onDelete("forEveryone")}
                        isLoading={isDeletingForEveryone}
                        disabled={isDeletingForMe}
                        variant="danger"
                        className="bg-red-600 text-white hover:bg-red-500 border-none w-full min-h-[40px]"
                    >
                        Delete for Everyone
                    </Button>
                )}
                <Button
                    onClick={() => onDelete("forMe")}
                    isLoading={isDeletingForMe}
                    disabled={isDeletingForEveryone}
                    variant="warning"
                    className="w-full min-h-[40px]"
                >
                    Delete for Me
                </Button>
                <Button
                    onClick={onClose}
                    disabled={isAnyPending}
                    variant="ghost"
                    className="w-full border border-ancient-input-border text-ancient-text-light min-h-[40px] mt-1"
                >
                    Cancel
                </Button>
            </div>
        </ModalShell>
    );
}
