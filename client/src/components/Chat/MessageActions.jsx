"use client";
import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useStarMessage } from "@/hooks/mutations/useStarMessage";
import { useDeleteMessage } from "@/hooks/mutations/useDeleteMessage";
import { useEditMessage } from "@/hooks/mutations/useEditMessage";
import { useReactToMessage } from "@/hooks/mutations/useReactToMessage";
import { useAuthStore } from "@/stores/authStore";
import {
  FaStar,
  FaEdit,
  FaTrashAlt,
  FaLaughBeam, // For react icon
} from "react-icons/fa";
import { BiReply } from "react-icons/bi"; // For reply icon
// Replaced FaAngleDown with a more mystical GiScrollUnfurled for the menu toggle
import { GiScrollUnfurled, GiFeather } from "react-icons/gi";
import { IoShareOutline } from "react-icons/io5"; // For forward icon (more modern share)
import ActionSheet from "@/components/common/ActionSheet";
import ConfirmModal from "@/components/common/ConfirmModal";
import InlineEditor from "@/components/common/InlineEditor";
import ReactionPicker from "@/components/common/ReactionPicker";

const DEFAULT_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏", "🔥", "✨", "🙏"];

export default function MessageActions({ message, isIncoming = false, onReply, onForward }) { // Added onReply, onForward props
  const userInfo = useAuthStore((s) => s.userInfo);
  const isMine = useMemo(() => String(message?.senderId) === String(userInfo?.id), [message, userInfo]);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message?.content || "");
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [showDropdownMenu, setShowDropdownMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const actionButtonsRef = useRef(null); // Ref for the main action buttons container
  const reactionsMenuRef = useRef(null);
  const dropdownMenuRef = useRef(null);

  const starMutation = useStarMessage();
  const delMutation = useDeleteMessage();
  const editMutation = useEditMessage();
  const reactMutation = useReactToMessage();

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside the main action buttons and any open menu
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

  const onStar = useCallback(() => {
    const currentlyStarredForUser = Array.isArray(message?.starredBy)
      ? message.starredBy.some((e) => (e?.userId ?? e) === userInfo?.id)
      : false;
    starMutation.mutate({ id: message.id, starred: !currentlyStarredForUser });
    setShowDropdownMenu(false);
  }, [message, userInfo, starMutation]);

  const onDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
    setShowDropdownMenu(false);
  }, []);

  const doDelete = useCallback((deleteType) => {
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
    onReply?.(message); // Call the provided onReply prop
    setShowDropdownMenu(false);
  }, [message, onReply]);

  const handleForward = useCallback(() => {
    onForward?.(message); // Call the provided onForward prop
    setShowDropdownMenu(false);
  }, [message, onForward]);

  // Controls
  const canEdit = isMine && message?.type === "text" && !message?.isDeleted; // Cannot edit deleted messages
  const canDelete = !message?.isDeleted; // Cannot delete an already deleted message (though it might show as "deleted")
  const isStarred = useMemo(() => Array.isArray(message?.starredBy) && message.starredBy.some((e) => (e?.userId ?? e) === userInfo.id), [message, userInfo]);


  // Inline editor for text messages when editing
  if (isEditing && message.type === "text") {
    return (
      <div className={`absolute ${isIncoming ? "left-0" : "right-0"} top-full mt-1 z-20`}>
        <InlineEditor
          value={editText}
          onChange={setEditText}
          onSave={onSaveEdit}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  // Main MessageActions component
  return (
    <div
      ref={actionButtonsRef} // Ref for the main action buttons container
      className={`absolute ${isIncoming ? "-right-2" : "-left-2"} -top-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
    >
      {/* Reaction Picker (appears above/below the message bubble) */}
      {showReactionsMenu && (
        <div ref={reactionsMenuRef} className="relative">
          <ReactionPicker
            open={showReactionsMenu}
            anchorSide={isIncoming ? "left" : "right"}
            onPick={onReact}
          />
        </div>
      )}

      {/* React Button */}
      <button
        type="button"
        className="relative bg-ancient-bg-medium border border-ancient-border-stone rounded-full p-2 text-ancient-icon-inactive hover:text-ancient-icon-glow shadow-md transition-colors duration-200"
        onClick={() => setShowReactionsMenu((s) => !s)}
        title="React"
      >
        <FaLaughBeam className="text-sm" />
      </button>

      {/* Dropdown Menu Toggle */}
      <button
        type="button"
        className="relative bg-ancient-bg-medium border border-ancient-border-stone rounded-full p-2 text-ancient-icon-inactive hover:text-ancient-icon-glow shadow-md transition-colors duration-200"
        onClick={() => setShowDropdownMenu((v) => !v)}
        title="More actions"
      >
        <GiScrollUnfurled className="text-sm" /> {/* Mystical scroll icon for menu */}
      </button>

      {/* Dropdown Menu via ActionSheet */}
      <div ref={dropdownMenuRef} className="relative">
        <ActionSheet
          open={showDropdownMenu}
          onClose={() => setShowDropdownMenu(false)}
          align={isIncoming ? "left" : "right"}
          items={[
            { label: "Reply", icon: BiReply, onClick: handleReply },
            { label: "Forward", icon: IoShareOutline, onClick: handleForward },
            { label: isStarred ? "Unstar" : "Star", icon: FaStar, onClick: onStar },
            ...(canEdit ? [{ label: "Edit", icon: GiFeather, onClick: onEditClick }] : []),
            ...(canDelete ? [{ label: "Delete", icon: FaTrashAlt, onClick: onDeleteClick, danger: true }] : []),
          ]}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <ConfirmModal
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => doDelete(isMine ? 'forEveryone' : 'forMe')}
          title="Confirm Delete"
          description="Are you sure you want to delete this message?"
          confirmText={isMine ? "Delete (for Everyone)" : "Delete (for Me)"}
          confirmLoading={delMutation.isPending}
          variant="danger"
          extra={isMine ? (
            <button
              className="mt-1 text-ancient-text-muted hover:text-ancient-text-light text-xs underline"
              onClick={() => doDelete('forMe')}
            >
              Delete only for me
            </button>
          ) : null}
        />
      )}
    </div>
  );
}