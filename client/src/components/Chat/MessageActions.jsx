"use client";
import React, { useMemo, useState } from "react";
import { useStarMessage } from "@/hooks/mutations/useStarMessage";
import { useDeleteMessage } from "@/hooks/mutations/useDeleteMessage";
import { useEditMessage } from "@/hooks/mutations/useEditMessage";
import { useReactToMessage } from "@/hooks/mutations/useReactToMessage";
import { useAuthStore } from "@/stores/authStore";

const DEFAULT_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏"];

export default function MessageActions({ message, compact = true }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const isMine = useMemo(() => String(message?.senderId) === String(userInfo?.id), [message, userInfo]);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message?.content || "");
  const [showReactions, setShowReactions] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  const starMutation = useStarMessage();
  const delMutation = useDeleteMessage();
  const editMutation = useEditMessage();
  const reactMutation = useReactToMessage();

  const onStar = () => {
    const currentlyStarredForUser = Array.isArray(message?.starredBy)
      ? message.starredBy.some((e) => (e?.userId ?? e) === userInfo?.id)
      : false;
    starMutation.mutate({ id: message.id, starred: !currentlyStarredForUser });
  };

  const onDelete = () => {
    setShowDeleteMenu((v) => !v);
  };

  const doDelete = (key) => {
    if (key === 'forEveryone') {
      const ok = window.confirm('Delete for everyone? This can only be done for a limited time.');
      if (!ok) return setShowDeleteMenu(false);
    }
    delMutation.mutate({ id: message.id, deleteType: key });
    setShowDeleteMenu(false);
  };

  const onSaveEdit = () => {
    if (!editText.trim()) return setIsEditing(false);
    editMutation.mutate(
      { id: message.id, content: editText.trim() },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const onReact = (emoji) => {
    reactMutation.mutate({ id: message.id, emoji });
    setShowReactions(false);
  };

  // Controls
  const canEdit = isMine && message?.type === "text";
  const canDelete = true; // allow delete for any message

  return (
    <div className={`flex ${compact ? "gap-2" : "gap-3"} items-center text-[12px] text-bubble-meta select-none relative`}>
      {/* React */}
      <button
        type="button"
        className="hover:underline"
        onClick={() => setShowReactions((s) => !s)}
      >
        React
      </button>
      {showReactions && (
        <div className="absolute mt-6 z-10 rounded-md bg-[#1f2c33] border border-[#2a3942] p-1 flex gap-1">
          {DEFAULT_EMOJIS.map((e) => (
            <button key={e} className="px-1" onClick={() => onReact(e)}>{e}</button>
          ))}
        </div>
      )}

      {/* Star */}
      <button type="button" className="hover:underline" onClick={onStar}>
        Star
      </button>

      {/* Edit */}
      {canEdit && !isEditing && (
        <button type="button" className="hover:underline" onClick={() => setIsEditing(true)}>
          Edit
        </button>
      )}

      {/* Delete */}
      {canDelete && (
        <div className="relative">
          <button type="button" className="hover:underline text-red-400" onClick={onDelete}>
            Delete
          </button>
          {showDeleteMenu && (
            <div className="absolute mt-2 left-0 z-10 w-40 bg-[#1f2c33] border border-[#2a3942] rounded-md shadow-lg p-1">
              <button className="w-full text-left px-2 py-1 hover:bg-[#2a3942]" onClick={() => doDelete('forMe')}>Delete for me</button>
              {isMine && (
                <button className="w-full text-left px-2 py-1 hover:bg-[#2a3942]" onClick={() => doDelete('forEveryone')}>Delete for everyone</button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Inline editor for text messages */}
      {isEditing && (
        <div className="absolute mt-6 z-10 bg-[#111b21] border border-[#2a3942] rounded-md p-2 flex items-center gap-2">
          <input
            className="bg-transparent outline-none text-white text-sm border border-[#2a3942] rounded px-2 py-1"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
          <button className="text-emerald-400 hover:underline" onClick={onSaveEdit}>
            Save
          </button>
          <button className="text-bubble-meta hover:underline" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
