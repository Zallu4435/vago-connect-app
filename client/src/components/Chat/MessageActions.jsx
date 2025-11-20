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
  FaCheck, // For save edit
  FaTimes, // For cancel edit
} from "react-icons/fa";
import { BiReply } from "react-icons/bi"; // For reply icon
// Replaced FaAngleDown with a more mystical GiScrollUnfurled for the menu toggle
import { GiScrollUnfurled, GiMagicLamp, GiArchiveRegister, GiSpellBook, GiBookmarklet, GiCrystalBall, GiBroadsword, GiFeather } from "react-icons/gi";
import { IoShareOutline } from "react-icons/io5"; // For forward icon (more modern share)

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
      <div className={`absolute ${isIncoming ? "left-0" : "right-0"} top-full mt-1 z-20 bg-ancient-bg-medium border border-ancient-border-stone rounded-lg p-2 flex items-center gap-2 shadow-xl animate-fade-in-up origin-bottom`}>
        <input
          className="bg-ancient-input-bg outline-none text-ancient-text-light text-sm border border-ancient-border-stone rounded px-3 py-1 min-w-[150px]"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSaveEdit();
            if (e.key === "Escape") setIsEditing(false);
          }}
          autoFocus
        />
        <button
          className="text-ancient-icon-glow hover:text-green-400 transition-colors duration-200"
          onClick={onSaveEdit}
          title="Save Alteration"
        >
          <FaCheck className="text-lg" />
        </button>
        <button
          className="text-ancient-text-muted hover:text-ancient-text-light transition-colors duration-200"
          onClick={() => setIsEditing(false)}
          title="Cancel Alteration"
        >
          <FaTimes className="text-lg" />
        </button>
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
        <div
          ref={reactionsMenuRef}
          className={`absolute ${isIncoming ? "left-0" : "right-0"} bottom-full mb-1 z-30 rounded-full bg-ancient-bg-dark border border-ancient-border-stone p-1 flex gap-1 shadow-xl animate-fade-in-up origin-bottom`}
        >
          {DEFAULT_EMOJIS.map((e) => (
            <button
              key={e}
              className="p-2 text-xl hover:bg-ancient-bubble-user rounded-full transition-colors duration-150"
              onClick={() => onReact(e)}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* React Button */}
      <button
        type="button"
        className="relative bg-ancient-bg-medium border border-ancient-border-stone rounded-full p-2 text-ancient-icon-inactive hover:text-ancient-icon-glow shadow-md transition-colors duration-200"
        onClick={() => setShowReactionsMenu((s) => !s)}
        title="React to Echo"
      >
        <FaLaughBeam className="text-sm" />
      </button>

      {/* Dropdown Menu Toggle */}
      <button
        type="button"
        className="relative bg-ancient-bg-medium border border-ancient-border-stone rounded-full p-2 text-ancient-icon-inactive hover:text-ancient-icon-glow shadow-md transition-colors duration-200"
        onClick={() => setShowDropdownMenu((v) => !v)}
        title="More Ancient Rites"
      >
        <GiScrollUnfurled className="text-sm" /> {/* Mystical scroll icon for menu */}
      </button>

      {/* Dropdown Menu */}
      {showDropdownMenu && (
        <div
          ref={dropdownMenuRef}
          className={`absolute ${isIncoming ? "left-0" : "right-0"} top-full mt-1 z-20 w-48 bg-ancient-bg-dark border border-ancient-border-stone rounded-md shadow-xl p-2 animate-fade-in-down origin-top-${isIncoming ? "left" : "right"}`}
        >
          {/* Reply */}
          <button
            className="flex items-center gap-3 w-full text-left px-4 py-2 hover:bg-ancient-bubble-user text-ancient-text-light text-sm rounded-md transition-colors duration-200"
            onClick={handleReply}
          >
            <BiReply className="text-ancient-icon-glow text-lg" /> Reply Echo
          </button>

          {/* Forward */}
          <button
            className="flex items-center gap-3 w-full text-left px-4 py-2 hover:bg-ancient-bubble-user text-ancient-text-light text-sm rounded-md transition-colors duration-200"
            onClick={handleForward}
          >
            <IoShareOutline className="text-ancient-icon-glow text-lg" /> Forward Echo
          </button>

          {/* Star */}
          <button
            className="flex items-center gap-3 w-full text-left px-4 py-2 hover:bg-ancient-bubble-user text-ancient-text-light text-sm rounded-md transition-colors duration-200"
            onClick={onStar}
          >
            <FaStar className={`text-sm ${isStarred ? "text-yellow-400" : "text-ancient-icon-inactive"}`} />{" "}
            {isStarred ? "Unmark Rune" : "Mark with Rune"}
          </button>

          {/* Edit */}
          {canEdit && (
            <button
              className="flex items-center gap-3 w-full text-left px-4 py-2 hover:bg-ancient-bubble-user text-ancient-text-light text-sm rounded-md transition-colors duration-200"
              onClick={onEditClick}
            >
              <GiFeather className="text-ancient-icon-glow text-lg" /> Alter Scroll
            </button>
          )}

          {/* Delete */}
          {canDelete && (
            <button
              className="flex items-center gap-3 w-full text-left px-4 py-2 hover:bg-ancient-bubble-user text-ancient-warning-text text-sm rounded-md transition-colors duration-200"
              onClick={onDeleteClick}
            >
              <FaTrashAlt className="text-red-500 text-lg" /> Banish Echo
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={`fixed inset-0 bg-ancient-bg-dark/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in`}>
          <div className="bg-ancient-bg-medium border border-ancient-border-stone rounded-lg p-6 shadow-xl w-80 text-center animate-zoom-in">
            <p className="text-ancient-text-light text-lg font-semibold mb-4 flex items-center justify-center gap-2">
              <GiBroadsword className="text-red-500 text-xl" /> Confirm Banishment
            </p>
            <p className="text-ancient-text-muted text-sm mb-6">
              Are you sure you wish to banish this echo from existence?
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="bg-ancient-bubble-user hover:bg-ancient-bubble-user-light text-ancient-text-light px-4 py-2 rounded-md transition-colors duration-200 shadow-md"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors duration-200 shadow-md"
                onClick={() => doDelete(isMine ? 'forEveryone' : 'forMe')}
              >
                Banish {isMine ? "(for All)" : "(for Me)"}
              </button>
            </div>
            {isMine && (
              <button
                className="mt-3 text-ancient-text-muted hover:text-ancient-text-light text-xs underline"
                onClick={() => { doDelete('forMe'); setShowDeleteConfirm(false); }}
              >
                Banish only for my Sight
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}