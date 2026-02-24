"use client";
import React, { useMemo, useState, useEffect } from "react";
import { useContacts } from "@/hooks/queries/useContacts";
import { useForwardMessages } from "@/hooks/mutations/useForwardMessages";
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/lib/toast";
import Image from "next/image";
import { IoClose } from "react-icons/io5";
import { FaPaperPlane, FaSearch, FaUserCircle } from "react-icons/fa";
import ModalShell from "@/components/common/ModalShell";
import ModalHeader from "@/components/common/ModalHeader";
import ThemedInput from "@/components/common/ThemedInput";
import Avatar from "@/components/common/Avatar";

export default function ForwardModal({ open, onClose, initialMessageIds = [] }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const { data: contacts = [], isLoading } = useContacts(userInfo?.id);
  const [selectedConvoIds, setSelectedConvoIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const forwardMutation = useForwardMessages();

  useEffect(() => {
    if (!open) {
      setSelectedConvoIds([]);
      setSearchTerm("");
    }
  }, [open]);

  const filteredContacts = useMemo(() => {
    if (!searchTerm) return contacts;
    const q = searchTerm.toLowerCase();
    return contacts.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.about?.toLowerCase()?.includes(q)
    );
  }, [contacts, searchTerm]);

  const toggleSelection = (convoId) => {
    if (!convoId) return;
    setSelectedConvoIds((prev) => {
      if (prev.includes(convoId)) return prev.filter((id) => id !== convoId);
      if (prev.length >= 5) {
        showToast.info("You can forward to up to 5 chats at once");
        return prev;
      }
      return [...prev, convoId];
    });
  };

  const handleForward = () => {
    if (!selectedConvoIds.length || !initialMessageIds.length) return;

    forwardMutation.mutate(
      {
        messageIds: initialMessageIds,
        toConversationIds: selectedConvoIds,
      },
      {
        onSuccess: () => {
          showToast.success("Messages forwarded");
          onClose?.();
        },
        onError: (err) => {
          showToast.error(err?.message || "Failed to forward messages");
        },
      }
    );
  };

  return (
    <ModalShell open={open} onClose={onClose} maxWidth="max-w-md">
      <div className="flex flex-col h-[60vh] sm:h-[70vh]">
        <ModalHeader
          title="Forward to..."
          Icon={FaPaperPlane}
          onClose={onClose}
          centerTitle
        />

        <div className="p-4 border-b border-ancient-border-stone bg-ancient-input-bg">
          <ThemedInput
            name="Search chats"
            state={searchTerm}
            setState={setSearchTerm}
            placeholder="Search recent chats..."
            Icon={FaSearch}
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {isLoading ? (
            <div className="p-8 text-center text-ancient-text-muted">Loading chats...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-ancient-text-muted">No recent chats found</div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => toggleSelection(contact.conversationId)}
                className={`
                  flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200
                  ${selectedConvoIds.includes(contact.conversationId)
                    ? "bg-ancient-icon-glow/20 border border-ancient-icon-glow/40 shadow-inner"
                    : "hover:bg-ancient-bg-medium border border-transparent"}
                `}
              >
                <Avatar
                  image={contact.profilePicture}
                  type="sm"
                  defaultImage="/default_avatar.png"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-ancient-text-light font-medium truncate">{contact.name}</h4>
                  <p className="text-xs text-ancient-text-muted truncate">{contact.about || "Available"}</p>
                </div>
                {selectedConvoIds.includes(contact.conversationId) && (
                  <div className="h-5 w-5 rounded-full bg-ancient-icon-glow flex items-center justify-center text-ancient-bg-dark shadow-sm">
                    <span className="text-[10px] font-bold">✓</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {selectedConvoIds.length > 0 && (
          <div className="p-4 bg-ancient-bg-medium border-t border-ancient-border-stone flex items-center justify-between animate-in slide-in-from-bottom-2">
            <div className="text-sm text-ancient-text-muted">
              {selectedConvoIds.length} chat{selectedConvoIds.length > 1 ? "s" : ""} selected
            </div>
            <button
              onClick={handleForward}
              disabled={forwardMutation.isPending}
              className="bg-ancient-icon-glow hover:bg-ancient-bubble-user-light text-ancient-bg-dark font-bold px-6 py-2 rounded-lg shadow-lg hover:shadow-ancient-icon-glow/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {forwardMutation.isPending ? "Forwarding..." : "Forward"}
              <FaPaperPlane className="text-xs" />
            </button>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
