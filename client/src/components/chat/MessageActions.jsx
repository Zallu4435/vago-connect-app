"use client";
import React, { useMemo, useState, useRef, useCallback } from "react";
import { useClickOutside } from '@/hooks/ui/useClickOutside';
import { useStarMessage } from '@/hooks/messages/useStarMessage';
import { useDeleteMessage } from '@/hooks/messages/useDeleteMessage';
import { useReactToMessage } from '@/hooks/messages/useReactToMessage';
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
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
import DeleteMessageModal from "@/components/common/DeleteMessageModal";
import ReactionPicker from "@/components/common/ReactionPicker";

const DEFAULT_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏", "🔥", "✨", "🙏"];

function MessageActions({
  message,
  isIncoming = false,
  onReply,
  onForward,
}) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const isMine = useMemo(() => String(message?.senderId) === String(userInfo?.id), [message, userInfo]);
  const setEditMessage = useChatStore((s) => s.setEditMessage);

  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [showDropdownMenu, setShowDropdownMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const actionButtonsRef = useRef(null);

  // Separate refs for the toggle buttons
  const reactionBtnRef = useRef(null);
  const actionToggleBtnRef = useRef(null);

  const starMutation = useStarMessage();
  const delMutation = useDeleteMessage();
  const reactMutation = useReactToMessage();

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
    console.log("Action: setEditMessage called with:", message.id); setEditMessage(message);
    setShowDropdownMenu(false);
  }, [message, setEditMessage]);

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

  // Enforce 48-hour rule for "Delete for Everyone" locally
  const canDeleteForEveryone = useMemo(() => {
    if (!isMine) return false;
    const createdAt = new Date(message?.createdAt).getTime();
    if (isNaN(createdAt)) return false;
    const fortyEightHours = 48 * 60 * 60 * 1000;
    return (Date.now() - createdAt) <= fortyEightHours;
  }, [isMine, message?.createdAt]);

  return (
    <div
      ref={actionButtonsRef}
      className={`
        absolute ${isIncoming ? "-right-8 md:-right-10" : "-left-8 md:-left-10"} top-0 bottom-0 z-20 flex flex-col justify-center gap-1 opacity-0 group-hover:opacity-100
        transition-opacity duration-200
      `}
    >
      {/* Reaction Picker */}
      {showReactionsMenu && (
        <div className="relative z-30">
          <ReactionPicker
            open={showReactionsMenu}
            onClose={() => setShowReactionsMenu(false)}
            anchorSide={isIncoming ? "left" : "right"}
            onPick={onReact}
            className="text-base sm:text-lg"
            containerClassName="p-1 sm:p-2"
            toggleRef={reactionBtnRef}
          />
        </div>
      )}

      {/* React Button */}
      <button
        ref={reactionBtnRef}
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
        style={{ padding: "6px" }}
        onClick={() => setShowReactionsMenu((s) => !s)}
      >
        <FaLaughBeam size={16} />
      </button>

      {/* Dropdown Toggle */}
      <button
        ref={actionToggleBtnRef}
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
        style={{ padding: "6px" }}
        onClick={() => setShowDropdownMenu((v) => !v)}
      >
        <GiScrollUnfurled size={16} />
      </button>

      {/* Dropdown Menu */}
      <div className="relative z-40">
        <ActionSheet
          open={showDropdownMenu}
          onClose={() => setShowDropdownMenu(false)}
          anchorRef={actionToggleBtnRef}
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
        <DeleteMessageModal
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onDelete={doDelete}
          isPending={delMutation.isPending}
          showForEveryoneButton={canDeleteForEveryone}
          description="Are you sure you want to delete this message?"
        />
      )}
    </div>
  );
}

export default React.memo(MessageActions, (prev, next) => {
  return (
    prev.message?.id === next.message?.id &&
    prev.isIncoming === next.isIncoming &&
    prev.message?.reactions?.length === next.message?.reactions?.length &&
    prev.message?.isDeletedForEveryone === next.message?.isDeletedForEveryone
  );
});
