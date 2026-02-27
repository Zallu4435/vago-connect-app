"use client";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useContactsPaginated } from '@/hooks/contacts/useContactsPaginated';
import { useForwardMessages } from '@/hooks/messages/useForwardMessages';
import { useAuthStore } from "@/stores/authStore";
import { useDebounce } from '@/hooks/ui/useDebounce';
import { showToast } from "@/lib/toast";
import { IoClose } from "react-icons/io5";
import { FaPaperPlane, FaSearch, FaUsers } from "react-icons/fa";
import { MdPersonSearch, MdCheckCircle } from "react-icons/md";
import ModalShell from "@/components/common/ModalShell";
import ModalHeader from "@/components/common/ModalHeader";
import Avatar from "@/components/common/Avatar";
import { useChatStore } from "@/stores/chatStore";
import { normalizeMessage } from "@/utils/messageHelpers";
import { upsertMessageInCache } from "@/lib/cacheHelpers";
import { useQueryClient } from "@tanstack/react-query";

const MAX_SELECTIONS = 5;

export default function ForwardModal({ open, onClose, initialMessageIds = [] }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const [selectedConvoIds, setSelectedConvoIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef(null);
  const forwardMutation = useForwardMessages();
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const storeMessages = useChatStore((s) => s.messages);
  const setMessages = useChatStore((s) => s.setMessages);
  const qc = useQueryClient();

  // Debounce the search term before sending to backend (400ms)
  const debouncedQ = useDebounce(searchTerm, 400);
  const isSearching = searchTerm !== debouncedQ; // true while user is typing

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useContactsPaginated(userInfo?.id, {
    limit: 30,
    q: debouncedQ.trim(),
  });

  // Flatten paginated pages into a single contacts array
  const contacts = useMemo(
    () => data?.pages?.flatMap((p) => p.contacts ?? [])?.filter(c => !c.isBlocked) ?? [],
    [data]
  );

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSelectedConvoIds([]);
      setSearchTerm("");
    }
  }, [open]);

  // Auto-focus search when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [open]);

  const toggleSelection = (convoId) => {
    if (!convoId) return;
    setSelectedConvoIds((prev) => {
      if (prev.includes(convoId)) return prev.filter((id) => id !== convoId);
      if (prev.length >= MAX_SELECTIONS) {
        showToast.info(`You can forward to up to ${MAX_SELECTIONS} chats at once`);
        return prev;
      }
      return [...prev, convoId];
    });
  };

  const handleForward = () => {
    if (!selectedConvoIds.length || !initialMessageIds.length) return;

    // OPTIMISTIC UPDATE: If forwarding to the current conversation
    const currentConvId = Number(currentChatUser?.conversationId || (currentChatUser?.id && currentChatUser?.isGroup ? currentChatUser.id : 0));
    const isForwardingToCurrent = selectedConvoIds.some(id => Number(id) === currentConvId);

    if (isForwardingToCurrent) {
      const optimisticMsgs = initialMessageIds.map(mid => {
        const original = storeMessages.find(m => Number(m.id) === Number(mid));
        if (!original) return null;

        return normalizeMessage({
          id: `temp-${Date.now()}-${Math.random()}`,
          conversationId: currentConvId,
          content: original.content || original.message,
          status: "pending",
          createdAt: new Date().toISOString(),
          isForwarded: true,
          type: original.type,
          caption: original.caption,
          isLocal: true,
        }, userInfo.id, currentChatUser.id, original.type);
      }).filter(Boolean);

      if (optimisticMsgs.length > 0) {
        setMessages(prev => [...(prev || []), ...optimisticMsgs]);
        optimisticMsgs.forEach(msg => upsertMessageInCache(qc, msg));
      }
    }

    forwardMutation.mutate(
      { messageIds: initialMessageIds, toConversationIds: selectedConvoIds },
      {
        onSuccess: () => {
          showToast.success("Messages forwarded successfully");
          onClose?.();
        },
        onError: (err) => {
          showToast.error("Failed to forward messages");
        },
      }
    );
  };

  // Build a lookup map for selected contacts (for chips)
  const selectedContacts = useMemo(
    () => contacts.filter((c) => selectedConvoIds.includes(c.conversationId)),
    [contacts, selectedConvoIds]
  );

  const isLoadingAny = isLoading || isSearching;

  return (
    <ModalShell open={open} onClose={onClose} maxWidth="max-w-md">
      <div className="flex flex-col h-[65vh] sm:h-[72vh]">

        {/* Header */}
        <ModalHeader
          title="Forward to…"
          Icon={FaPaperPlane}
          onClose={onClose}
          centerTitle
        />

        {/* Search box */}
        <div className="px-4 pt-3 pb-2 border-b border-ancient-border-stone/50 bg-ancient-bg-dark">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ancient-text-muted text-sm pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search chats or groups…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-ancient-input-bg border border-ancient-input-border focus:border-ancient-icon-glow rounded-full pl-9 pr-9 py-2 text-[14px] text-ancient-text-light placeholder:text-ancient-text-muted outline-none transition-all"
              aria-label="Search chats"
            />
            {/* Clear button */}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ancient-text-muted hover:text-ancient-text-light transition-colors"
                aria-label="Clear search"
              >
                <IoClose className="text-base" />
              </button>
            )}
            {/* Debounce spinner */}
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-3.5 h-3.5 border-2 border-ancient-icon-glow border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Selected chips row */}
        {selectedContacts.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto custom-scrollbar border-b border-ancient-border-stone/30 bg-ancient-bg-dark">
            {selectedContacts.map((c) => (
              <button
                key={c.conversationId}
                onClick={() => toggleSelection(c.conversationId)}
                className="flex-shrink-0 flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-ancient-icon-glow/15 border border-ancient-icon-glow/40 rounded-full text-[12px] text-ancient-text-light hover:bg-red-500/20 hover:border-red-400/50 transition-all group"
                title={`Remove ${c.name}`}
                aria-label={`Deselect ${c.name}`}
              >
                <Avatar
                  image={c.profilePicture}
                  type="xs"
                  defaultImage="/default_avatar.png"
                />
                <span className="max-w-[80px] truncate font-medium">{c.name}</span>
                <IoClose className="text-[10px] text-ancient-text-muted group-hover:text-red-400 transition-colors" />
              </button>
            ))}
            <span className="ml-auto flex-shrink-0 text-[11px] text-ancient-text-muted whitespace-nowrap">
              {selectedConvoIds.length}/{MAX_SELECTIONS}
            </span>
          </div>
        )}

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoadingAny ? (
            /* Skeleton loader */
            <div className="p-3 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-ancient-input-bg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-ancient-input-bg rounded w-2/5" />
                    <div className="h-2.5 bg-ancient-input-bg/60 rounded w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-ancient-text-muted py-10">
              <MdPersonSearch className="text-5xl opacity-40" />
              <p className="text-sm font-medium">
                {debouncedQ ? `No results for "${debouncedQ}"` : "No chats found"}
              </p>
              {debouncedQ && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-xs text-ancient-icon-glow hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {contacts.map((contact) => {
                const isSelected = selectedConvoIds.includes(contact.conversationId);
                return (
                  <div
                    key={contact.conversationId ?? contact.id}
                    onClick={() => toggleSelection(contact.conversationId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleSelection(contact.conversationId);
                      }
                    }}
                    aria-pressed={isSelected}
                    aria-label={`${isSelected ? "Deselect" : "Select"} ${contact.name}`}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                      transition-all duration-150 select-none
                      ${isSelected
                        ? "bg-ancient-icon-glow/15 border border-ancient-icon-glow/40"
                        : "hover:bg-ancient-input-bg border border-transparent"}
                    `}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <Avatar
                        image={contact.profilePicture}
                        type="sm"
                        defaultImage="/default_avatar.png"
                      />
                      {/* Group badge */}
                      {contact.isGroup && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-ancient-bg-dark border border-ancient-border-stone flex items-center justify-center">
                          <FaUsers className="text-[8px] text-ancient-icon-glow" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-[14px] text-ancient-text-light font-medium truncate leading-tight">
                          {contact.name}
                        </h4>
                        {contact.isSelf && (
                          <span className="text-[10px] text-ancient-icon-glow font-semibold flex-shrink-0">
                            (You)
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-ancient-text-muted truncate leading-tight">
                        {contact.about || (contact.isGroup ? "Group" : "Online")}
                      </p>
                    </div>

                    {/* Checkmark */}
                    {isSelected && (
                      <MdCheckCircle className="text-xl text-ancient-icon-glow flex-shrink-0" />
                    )}
                  </div>
                );
              })}

              {/* Load more */}
              {hasNextPage && (
                <div className="pt-2 pb-1 flex justify-center">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="text-[12px] text-ancient-icon-glow hover:underline disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <div className="w-3 h-3 border-2 border-ancient-icon-glow border-t-transparent rounded-full animate-spin" />
                        Loading…
                      </>
                    ) : (
                      "Load more"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — forward action */}
        {selectedConvoIds.length > 0 && (
          <div className="flex-shrink-0 px-4 py-3 bg-ancient-bg-medium border-t border-ancient-border-stone/50 flex items-center justify-between animate-panel-in-up">
            <div className="text-[13px] text-ancient-text-muted">
              <span className="text-ancient-text-light font-semibold">
                {selectedConvoIds.length}
              </span>{" "}
              chat{selectedConvoIds.length > 1 ? "s" : ""} selected
            </div>
            <button
              onClick={handleForward}
              disabled={forwardMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-ancient-icon-glow hover:brightness-110 text-ancient-bg-dark font-semibold text-[13px] shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="Forward messages"
            >
              {forwardMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-ancient-bg-dark border-t-transparent rounded-full animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Forward
                  <FaPaperPlane className="text-xs" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
