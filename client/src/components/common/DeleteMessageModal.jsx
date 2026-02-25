"use client";
import React from "react";
import { FaTrashAlt } from "react-icons/fa";
import ModalShell from "@/components/common/ModalShell";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function DeleteMessageModal({
    open,
    onClose,
    title = "Delete Message",
    description,
    isPending = false,
    onDelete,
    showForEveryoneButton = false,
}) {
    if (!open) return null;

    return (
        <ModalShell open={open} onClose={isPending ? () => { } : onClose} maxWidth="max-w-xs sm:max-w-sm">
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
                    <button
                        onClick={() => onDelete("forEveryone")}
                        disabled={isPending}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 font-bold text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-h-[40px]"
                    >
                        {isPending ? <LoadingSpinner size={20} color="text-white" /> : "Delete for Everyone"}
                    </button>
                )}
                <button
                    onClick={() => onDelete("forMe")}
                    disabled={isPending}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 font-bold text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-h-[40px]"
                >
                    {isPending ? <LoadingSpinner size={20} color="text-white" /> : "Delete for Me"}
                </button>
                <button
                    onClick={onClose}
                    disabled={isPending}
                    className="px-4 py-2 mt-1 border border-ancient-input-border text-ancient-text-light hover:bg-ancient-input-bg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
                >
                    Cancel
                </button>
            </div>
        </ModalShell>
    );
}
