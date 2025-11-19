"use client";
import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { GET_INITIAL_CONTACTS_ROUTE } from "@/utils/ApiRoutes";
import { useForwardMessages } from "@/hooks/mutations/useForwardMessages";
import { showToast } from "@/lib/toast";

export default function ForwardModal({ open, onClose, fromUserId, initialMessageIds = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const forwardMutation = useForwardMessages();

  useEffect(() => {
    if (!open || !fromUserId) return;
    let ignore = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(`${GET_INITIAL_CONTACTS_ROUTE}/${fromUserId}`);
        // Expecting { data: [ { conversationId, type, user: {...}, lastMessage, participantState } ], onlineUsers }
        const list = (data?.data || []).filter((x) => x?.conversationId);
        if (!ignore) setItems(list);
      } catch (e) {
        if (!ignore) setError("Failed to load chats");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [open, fromUserId]);

  const toggle = (cid) => {
    setSelected((prev) => (prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]));
  };

  const canSubmit = useMemo(() => initialMessageIds.length > 0 && selected.length > 0, [initialMessageIds, selected]);

  const onSubmit = () => {
    if (!canSubmit) return;
    forwardMutation.mutate(
      { messageIds: initialMessageIds, toConversationIds: selected },
      { onSuccess: () => { showToast.success("Message(s) forwarded"); onClose?.(); } }
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#111b21] border border-[#2a3942] rounded-lg w-full max-w-md p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white text-base">Forward to...</h3>
          <button className="text-bubble-meta hover:underline" onClick={onClose}>Close</button>
        </div>

        {loading && <div className="text-bubble-meta text-sm">Loading chats...</div>}
        {error && <div className="text-red-400 text-sm mb-2">{error}</div>}

        <div className="max-h-72 overflow-auto custom-scrollbar space-y-1">
          {items.map((it) => (
            <label key={it.conversationId} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#1f2c33]">
              <input
                type="checkbox"
                checked={selected.includes(it.conversationId)}
                onChange={() => toggle(it.conversationId)}
              />
              <div className="flex flex-col">
                <span className="text-white text-sm">{it?.user?.name || `Conversation ${it.conversationId}`}</span>
                <span className="text-bubble-meta text-xs">{it?.type}</span>
              </div>
            </label>
          ))}
          {!loading && items.length === 0 && (
            <div className="text-bubble-meta text-sm">No chats found.</div>
          )}
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button className="text-bubble-meta hover:underline" onClick={onClose}>Cancel</button>
          <button
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-3 py-1 rounded disabled:opacity-50"
            disabled={!canSubmit || forwardMutation.isPending}
            onClick={onSubmit}
          >
            {forwardMutation.isPending ? "Forwarding..." : `Forward (${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
