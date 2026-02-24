"use client";
import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useStarMessage } from "@/hooks/mutations/useStarMessage";
import { useDeleteMessage } from "@/hooks/mutations/useDeleteMessage";
import { useEditMessage } from "@/hooks/mutations/useEditMessage";
import { useReactToMessage } from "@/hooks/mutations/useReactToMessage";
import { useAuthStore } from "@/stores/authStore";
import {
  FaStar,
  FaEdit,
  FaTrashAlt,
  FaLaughBeam,
} from "react-icons/fa";
import { BiReply } from "react-icons/bi";
import { GiScrollUnfurled, GiFeather } from "react-icons/gi";
import { IoShareOutline } from "react-icons/io5";
import { MdContentCopy } from "react-icons/md";
import { showToast } from "@/lib/toast";
import ActionSheet from "@/components/common/ActionSheet";
import ModalShell from "@/components/common/ModalShell";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import InlineEditor from "@/components/common/InlineEditor";
import ReactionPicker from "@/components/common/ReactionPicker";

const DEFAULT_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏", "🔥", "✨", "🙏"];

export default function MessageActions({
  message,
  isIncoming = false,
  onReply,
  onForward,
}) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const isMine = useMemo(() => String(message?.senderId) === String(userInfo?.id), [message, userInfo]);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message?.content || "");
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [showDropdownMenu, setShowDropdownMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const actionButtonsRef = useRef(null);
  const reactionsMenuRef = useRef(null);
  const dropdownMenuRef = useRef(null);

  const starMutation = useStarMessage();
  const delMutation = useDeleteMessage();
  const editMutation = useEditMessage();
  const reactMutation = useReactToMessage();

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Ignore clicks that occur inside the ActionSheet portal
      if (document.getElementById('action-sheet-portal')?.contains(event.target)) {
        return;
      }

      if (
        actionButtonsRef.current && !actionButtonsRef.current.contains(event.target) &&
        reactionsMenuRef.current && !reactionsMenuRef.current.contains(event.target) &&
        dropdownMenuRef.current && !dropdownMenuRef.current.contains(event.target)
      ) {
        setShowReactionsMenu(false);
        setShowDropdownMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const onDeleteClick = useCallback(() => {
    console.log("Delete action clicked!");
    setShowDeleteConfirm(true);
    setShowDropdownMenu(false);
  }, []);

  const doDelete = useCallback((deleteType) => {
    console.log("Confirming delete:", deleteType);
    delMutation.mutate({ id: message.id, deleteType });
    setShowDeleteConfirm(false);
  }, [message, delMutation]);

  const onEditClick = useCallback(() => {
    setIsEditing(true);
    setEditText(message?.content || "");
    setShowDropdownMenu(false);
  }, [message]);

  const onSaveEdit = useCallback(() => {
    if (!editText.trim() || editText === message.content) return setIsEditing(false);
    editMutation.mutate(
      { id: message.id, content: editText.trim() },
      { onSuccess: () => setIsEditing(false) }
    );
  }, [editText, message, editMutation]);

  const onReact = useCallback((emoji) => {
    reactMutation.mutate({ id: message.id, emoji });
    setShowReactionsMenu(false);
    setShowDropdownMenu(false);
  }, [message, reactMutation]);

  const handleReply = useCallback(() => {
    onReply?.(message);
    setShowDropdownMenu(false);
  }, [message, onReply]);

  const handleForward = useCallback(() => {
    console.log("Forward action clicked for message:", message.id);
    onForward?.(message);
    setShowDropdownMenu(false);
  }, [message, onForward]);

  const onCopy = useCallback(async () => {
    console.log("Copy action clicked!");
    const text = message?.content || message?.message || "";
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        console.log("Using execCommand fallback for copy");
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (error) {
          throw new Error("Failed to copy using execCommand");
        } finally {
          textArea.remove();
        }
      }
      showToast.success("Message copied to clipboard");
    } catch (err) {
      console.error("Copy error:", err);
      showToast.error("Failed to copy message");
    }
    setShowDropdownMenu(false);
  }, [message]);

  const canEdit = isMine && message?.type === "text" && !message?.isDeletedForEveryone;
  const canDelete = !message?.isDeletedForEveryone;

  if (isEditing && message.type === "text") {
    return (
      <div className={`absolute ${isIncoming ? "left-0" : "right-0"} top-full mt-1 z-20 w-[260px] sm:w-[350px]`}>
        <InlineEditor
          value={editText}
          onChange={setEditText}
          onSave={onSaveEdit}
          onCancel={() => setIsEditing(false)}
          isSaving={editMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div
      ref={actionButtonsRef}
      className={`
        absolute ${isIncoming ? "-right-4" : "-left-4"} -top-2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100
        transition-opacity duration-200
        max-w-[calc(100vw-48px)]
      `}
    >
      {/* Reaction Picker */}
      {showReactionsMenu && (
        <div ref={reactionsMenuRef} className="relative z-30">
          <ReactionPicker
            open={showReactionsMenu}
            anchorSide={isIncoming ? "left" : "right"}
            onPick={onReact}
            className="text-base sm:text-lg"
            containerClassName="p-1 sm:p-2"
          />
        </div>
      )}

      {/* React Button */}
      <button
        type="button"
        aria-label="React to message"
        className="
          relative bg-ancient-bg-medium border border-ancient-border-stone
          rounded-full p-1.5 sm:p-2
          text-ancient-icon-inactive hover:text-ancient-icon-glow
          shadow-md transition-colors duration-200
          flex items-center justify-center
          text-lg sm:text-xl
          cursor-pointer
          focus:outline-2 focus:outline-ancient-icon-glow
        "
        onClick={() => setShowReactionsMenu((s) => !s)}
      >
        <FaLaughBeam />
      </button>

      {/* Dropdown Toggle */}
      <button
        type="button"
        aria-label="More message actions"
        className="
          relative bg-ancient-bg-medium border border-ancient-border-stone
          rounded-full p-1.5 sm:p-2
          text-ancient-icon-inactive hover:text-ancient-icon-glow
          shadow-md transition-colors duration-200
          flex items-center justify-center
          text-lg sm:text-xl
          cursor-pointer
          focus:outline-2 focus:outline-ancient-icon-glow
        "
        onClick={() => setShowDropdownMenu((v) => !v)}
      >
        <GiScrollUnfurled />
      </button>

      {/* Dropdown Menu */}
      <div ref={dropdownMenuRef} className="relative z-40">
        {console.log("Rendering ActionSheet for message:", message.id, "showDropdownMenu:", showDropdownMenu)}
        <ActionSheet
          open={showDropdownMenu}
          onClose={() => setShowDropdownMenu(false)}
          anchorRef={dropdownMenuRef}
          align={isIncoming ? "left" : "right"}
          items={[
            { label: "Reply", icon: BiReply, onClick: handleReply },
            { label: "Forward", icon: IoShareOutline, onClick: handleForward },
            { label: "Copy", icon: MdContentCopy, onClick: onCopy },
            ...(canEdit ? [{ label: "Edit", icon: GiFeather, onClick: onEditClick }] : []),
            ...(canDelete ? [{ label: "Delete", icon: FaTrashAlt, onClick: onDeleteClick, danger: true }] : []),
          ].map(item => ({
            ...item,
            onClick: () => {
              console.log("ActionSheet menu item clicked:", item.label);
              item.onClick();
            }
          }))}
        />
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <ModalShell open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} maxWidth="max-w-xs sm:max-w-sm">
          <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b bg-red-900/30 border-red-800/60">
            <FaTrashAlt className="text-red-400 text-xl sm:text-2xl" />
            <h3 className="text-ancient-text-light text-base sm:text-lg font-bold">Delete Message</h3>
          </div>
          <div className="p-4 sm:p-5 text-ancient-text-muted text-sm sm:text-base leading-relaxed">
            Are you sure you want to delete this message?
          </div>
          <div className="flex flex-col gap-2 p-3 sm:p-4 bg-ancient-bg-medium border-t border-ancient-border-stone">
            {isMine && (
              <button
                onClick={() => doDelete("forEveryone")}
                disabled={delMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 font-bold text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-60"
              >
                {delMutation.isPending ? <LoadingSpinner size={20} /> : "Delete for Everyone"}
              </button>
            )}
            <button
              onClick={() => doDelete("forMe")}
              disabled={delMutation.isPending}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 font-bold text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-60"
            >
              {delMutation.isPending ? <LoadingSpinner size={20} /> : "Delete for Me"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={delMutation.isPending}
              className="px-4 py-2 mt-1 border border-ancient-input-border text-ancient-text-light hover:bg-ancient-input-bg rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
