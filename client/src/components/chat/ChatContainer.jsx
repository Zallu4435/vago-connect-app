"use client";
import React, { useState, useCallback, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { updateContactFieldsInCache } from "@/lib/cacheHelpers";
import MessageWrapper from "./MessageWrapper";
import ImageGridWrapper from "./ImageGridWrapper";
import SelectMessagesBar from "./SelectMessagesBar";
import { useInfiniteScroll } from "@/hooks/ui/useInfiniteScroll";
import { showToast } from "@/lib/toast";
import Image from "next/image";
import { useRenderLog } from "@/hooks/ui/useRenderLog";
const ForwardModal = dynamic(() => import("./ForwardModal"), { ssr: false });
import { useMessagesPaginated } from '@/hooks/messages/useMessagesPaginated';
import { useDeleteMessage } from '@/hooks/messages/useDeleteMessage';
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import { MdArrowDownward, MdChat } from "react-icons/md";
import DeleteMessageModal from "@/components/common/DeleteMessageModal";
import { clusterMessages, isWithinDeletionWindow } from "@/utils/chatHelpers";
import dynamic from "next/dynamic";

function ChatContainer() {
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const userInfo = useAuthStore((s) => s.userInfo);
  const selectMode = useChatStore((s) => s.selectMode);
  const setSelectMode = useChatStore((s) => s.setSelectMode);
  const selectedIds = useChatStore((s) => s.selectedIds);
  const setSelectedIds = useChatStore((s) => s.setSelectedIds);
  const isDeletingForMe = useChatStore((s) => s.isDeletingForMe);
  const setIsDeletingForMe = useChatStore((s) => s.setIsDeletingForMe);
  const isDeletingForEveryone = useChatStore((s) => s.isDeletingForEveryone);
  const setIsDeletingForEveryone = useChatStore((s) => s.setIsDeletingForEveryone);


  const [showForward, setShowForward] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const setMessages = useChatStore((s) => s.setMessages);
  const messages = useChatStore((s) => s.messages);
  const containerRef = useRef(null);

  const delMutation = useDeleteMessage(); // Sentinel for auto-scroll
  const loadingOlderRef = useRef(false);
  const shouldAutoScrollRef = useRef(true); // Track if we should auto-scroll
  const prevMessagesLengthRef = useRef(0); // Track to detect new messages
  const [showJump, setShowJump] = useState(false);

  // Paginated messages logic
  const {
    data: pagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading, // Destructure the actual loading state
  } = useMessagesPaginated(
    userInfo?.id ? String(userInfo.id) : undefined,
    currentChatUser?.id ? String(currentChatUser.id) : undefined,
    {
      limit: 50,
      markRead: true,
      isGroup: currentChatUser?.isGroup || currentChatUser?.type === 'group'
    }
  );

  const mergedMessages = useMemo(() => {
    const pages = pagesData?.pages || [];
    return pages.flatMap((p) => p.messages);
  }, [pagesData]);

  const qc = useQueryClient();
  useEffect(() => {
    if (currentChatUser?.id && userInfo?.id) {
      updateContactFieldsInCache(qc, (c) => {
        const cPeerId = String(c.id);
        const cConvId = String(c.conversationId || "");
        const isGroup = !!(currentChatUser?.isGroup || currentChatUser?.type === 'group');

        const isMatch = isGroup
          ? (cConvId !== "0" && cConvId === String(currentChatUser.id))
          : (cPeerId === String(currentChatUser.id));

        if (isMatch) {
          return { ...c, totalUnreadMessages: 0 };
        }
        return c;
      });
    }
  }, [currentChatUser?.id, userInfo?.id, qc]);

  // Deleted for user filter
  const isDeletedForUser = useCallback((m, uid) => {
    const arr = m?.deletedBy;
    if (!Array.isArray(arr)) return false;
    const uidStr = String(uid ?? "");
    return arr.some((e) => {
      if (e == null) return false;
      if (typeof e === 'number' || typeof e === 'string') return String(e) === uidStr;
      if (typeof e === 'object') {
        const val = e.userId ?? e.id ?? e;
        return String(val) === uidStr;
      }
      return false;
    });
  }, []);

  const filteredMessages = useMemo(() => {
    const storeMsgs = Array.isArray(messages) ? messages : [];
    const cachePages = pagesData?.pages || [];
    const cacheMsgs = cachePages.flatMap((p) => p.messages) || [];

    const activeConvId = currentChatUser?.conversationId ? String(currentChatUser.conversationId) : "";
    const activePeerId = currentChatUser?.id ? String(currentChatUser.id) : "";
    const isGroup = currentChatUser?.isGroup || currentChatUser?.type === 'group';

    const byId = new Map();
    const tempToRealId = new Map();

    // 1. Cache is the source of truth
    cacheMsgs.forEach(m => {
      if (!m || !m.id) return;
      const mid = String(m.id);
      byId.set(mid, m);
      if (m.tempId) tempToRealId.set(String(m.tempId), mid);
    });

    // 2. Store holds pending/optimistic messages
    storeMsgs.forEach(m => {
      if (!m || !m.id) return;

      // EXTREMELY IMPORTANT: Filter global store messages to only show for this chat
      const msgConvId = m.conversationId ? String(m.conversationId) : "0";
      let isMatch = false;
      if (isGroup) {
        isMatch = (msgConvId === activeConvId) || (msgConvId === activePeerId);
      } else {
        const isConvMatch = activeConvId && activeConvId !== "0" && msgConvId === activeConvId;
        const isPeerMatch = (String(m.senderId) === activePeerId && String(m.receiverId) === String(userInfo?.id)) ||
          (String(m.senderId) === String(userInfo?.id) && String(m.receiverId) === activePeerId);
        isMatch = isConvMatch || isPeerMatch || (msgConvId === "0" && isPeerMatch);
      }

      if (!isMatch) return;

      const mid = String(m.id);
      if (!byId.has(mid) && !tempToRealId.has(mid)) {
        byId.set(mid, m);
      }
    });

    const all = Array.from(byId.values());
    all.sort((a, b) => {
      const ta = new Date(a.timestamp || a.createdAt || 0).getTime();
      const tb = new Date(b.timestamp || b.createdAt || 0).getTime();
      return ta - tb;
    });

    return all;
  }, [messages, pagesData, userInfo?.id, currentChatUser?.id, currentChatUser?.conversationId, currentChatUser?.isGroup, currentChatUser?.type]);

  useRenderLog("ChatContainer", { filteredMessages, currentChatUser });

  // Scroll Anchoring: Preserve position when loading history from the top
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || !loadingOlderRef.current) return;

    const currentScrollHeight = el.scrollHeight;
    const previousHeight = prevScrollHeightRef.current;

    if (previousHeight > 0 && currentScrollHeight > previousHeight) {
      const heightDiff = currentScrollHeight - previousHeight;
      el.scrollTop += heightDiff;
    }

    loadingOlderRef.current = false;
  }, [filteredMessages]);

  const prevScrollHeightRef = useRef(0);
  useLayoutEffect(() => {
    prevScrollHeightRef.current = containerRef.current?.scrollHeight || 0;
  });

  const prevLastIdRef = useRef(null);

  // Auto-scroll to bottom using modern pattern with useLayoutEffect
  // This runs synchronously before browser paint, preventing flicker
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const currentLen = filteredMessages.length;
    const lastMessage = currentLen > 0 ? filteredMessages[currentLen - 1] : null;
    const lastId = lastMessage ? String(lastMessage.id) : null;

    // A message is "newly added at bottom" if the last ID changed
    // AND we aren't currently loading pagination history from the top.
    const isActuallyNewAtBottom = lastId !== prevLastIdRef.current && !loadingOlderRef.current;
    const isInitialLoad = currentLen > 0 && prevMessagesLengthRef.current === 0;

    const isMyMessage = lastMessage && String(lastMessage.senderId) === String(userInfo?.id);

    // Force scroll if:
    // 1. It's the VERY FIRST batch of messages loaded (0 -> N)
    // 2. A genuinely new message arrived at the bottom that WE sent
    const forceScroll = (isActuallyNewAtBottom && isMyMessage) || isInitialLoad;

    // Update refs AFTER calculation for next render
    prevLastIdRef.current = lastId;
    prevMessagesLengthRef.current = currentLen;

    if (loadingOlderRef.current) return;
    if (!shouldAutoScrollRef.current && !forceScroll) return;

    // Use requestAnimationFrame AND a tiny timeout to ensure DOM layout is truly finished
    // especially for larger batches or clustered images.
    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    });
  }, [filteredMessages, userInfo?.id]);

  // Reset auto-scroll when chat changes and scroll to bottom immediately
  useEffect(() => {
    shouldAutoScrollRef.current = true;

    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    });
  }, [currentChatUser?.id]);

  const setReplyTo = useChatStore((s) => s.setReplyTo);
  const handleReply = useCallback((message) => {
    setReplyTo(message);
  }, [setReplyTo]);
  const handleForward = useCallback((message) => {
    setSelectedIds([Number(message.id)]);
    setShowForward(true);
  }, []);
  const toggleSelect = useCallback((id) => {
    const numId = Number(id);
    // Check if the message is already deleted — use numeric comparison
    const message = filteredMessages.find(m => Number(m.id) === numId);
    if (!message) return;
    if (message.isDeletedForEveryone || isDeletedForUser(message, userInfo?.id)) {
      showToast.error("Cannot select a deleted message");
      return;
    }
    if (message.isSystemMessage) {
      return;
    }

    setSelectedIds((prev) => {
      let next;
      if (prev.some(x => Number(x) === numId)) next = prev.filter((x) => Number(x) !== numId);
      else if (prev.length >= 50) {
        showToast.info("You can select up to 50 messages at once");
        return prev;
      }
      else next = [...prev, numId];
      return next;
    });
  }, [filteredMessages, isDeletedForUser, userInfo?.id]);

  const handleBulkCopy = useCallback(async () => {
    if (selectedIds.length === 0) return;
    const selectedMsgs = filteredMessages
      .filter(m => selectedIds.some(x => Number(x) === Number(m.id)))
      .sort((a, b) => new Date(a.timestamp || a.createdAt || 0) - new Date(b.timestamp || b.createdAt || 0));

    const textToCopy = selectedMsgs
      .map(m => {
        const time = new Date(m.timestamp || m.createdAt || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const senderInfo = Number(m.senderId) === Number(userInfo?.id) ? 'You' : (m.sender?.name || currentChatUser?.name || 'Contact');
        return `[${time}] ${senderInfo}: ${m.type === 'text' ? m.content : `[${m.type}]`}`;
      })
      .join('\n');

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        try { document.execCommand('copy'); } finally { textArea.remove(); }
      }
      showToast.success(`${selectedIds.length} messages copied`);
      setSelectMode(false);
      setSelectedIds([]);
    } catch (err) {
      console.error("Copy error:", err);
      showToast.error("Failed to copy messages");
    }
  }, [selectedIds, filteredMessages, userInfo?.id, currentChatUser?.name]);

  const handleBulkDelete = useCallback(async (deleteType) => {
    if (selectedIds.length === 0) return;

    if (deleteType === 'forMe') setIsDeletingForMe(true);
    else setIsDeletingForEveryone(true);

    try {
      // SEQUENTIAL PROCESSING: To avoid saturating the database connection pool (P2028),
      // we delete messages one by one with a tiny delay.
      for (const id of selectedIds) {
        await delMutation.mutateAsync({ id, deleteType });
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      showToast.success(`Deleted ${selectedIds.length} messages`);
      setShowDeleteConfirm(false);
      setSelectMode(false);
      setSelectedIds([]);
    } catch (e) {
      console.error("Bulk delete error", e);
      showToast.error("Failed to delete some messages");
    } finally {
      setIsDeletingForMe(false);
      setIsDeletingForEveryone(false);
    }
  }, [selectedIds, delMutation]);

  // Determine if ALL selected messages belong to the current user AND are within the legal deletion window
  const canDeleteForEveryone = useMemo(() => {
    if (selectedIds.length === 0) return false;
    const selectedMsgs = filteredMessages.filter(m => selectedIds.some(x => Number(x) === Number(m.id)));

    return selectedMsgs.every(m => {
      const isMine = String(m.senderId) === String(userInfo?.id);
      const isWithinWindow = isWithinDeletionWindow(m.timestamp || m.createdAt);
      return isMine && isWithinWindow;
    });
  }, [selectedIds, filteredMessages, userInfo?.id, isWithinDeletionWindow]);

  const topSentinelRef = useInfiniteScroll({
    containerRef,
    hasNextPage,
    isFetchingNextPage,
    // CRITICAL: Suppress pagination until we have initial data and aren't snapping to bottom
    isLoading: isLoading || loadingOlderRef.current || filteredMessages.length === 0,
    fetchNextPage: () => {
      loadingOlderRef.current = true;
      fetchNextPage();
    },
    rootMargin: '50px 0px 0px 0px', // Smaller margin to prevent premature triggers
    onScroll: ({ distanceFromBottom }) => {
      setShowJump(distanceFromBottom > 150);
      shouldAutoScrollRef.current = distanceFromBottom <= 150;
    }
  });
  const jumpToLatest = useCallback(() => {
    if (!containerRef.current) return;

    // Re-enable auto-scroll and scroll to bottom
    shouldAutoScrollRef.current = true;
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto custom-scrollbar flex flex-col relative"
    >
      {/* Optional: floating background visuals */}
      <div className="bg-chat-background bg-fixed h-full w-full opacity-[0.04] fixed left-0 top-0 z-0 pointer-events-none"></div>

      <div className="flex w-full">
        <div className="flex flex-col justify-end w-full gap-3 px-2 sm:px-4 py-3">
          {/* Top sentinel for pagination - NOT sticky to prevent premature triggers */}
          <div ref={topSentinelRef} className="h-6 flex justify-center w-full">
            {isFetchingNextPage && (
              <LoadingSpinner className="text-ancient-text-muted" size={16} label="Loading older messages…" />
            )}
          </div>

          {/* Select messages control bar (sticky) */}
          {filteredMessages.some(m => !m.isSystemMessage) && (
            <SelectMessagesBar
              selectMode={selectMode}
              selectedCount={selectedIds.length}
              onToggleSelect={() => {
                if (selectMode) {
                  setSelectMode(false);
                  setSelectedIds([]);
                } else {
                  setSelectMode(true);
                }
              }}
              onCancel={() => { setSelectMode(false); setSelectedIds([]); }}
              onForward={() => setShowForward(true)}
              onCopy={handleBulkCopy}
              onDelete={() => setShowDeleteConfirm(true)}
            />
          )}
          {/* Message stack */}
          {(() => {
            // Comprehensive loading state check
            const hasAnyMessages = filteredMessages.length > 0;
            const isInitialLoading = !hasAnyMessages && (isLoading || (isFetchingNextPage && !pagesData));

            if (isInitialLoading) {
              return (
                <div className="absolute inset-0 flex flex-col items-center justify-center h-full w-full pointer-events-none z-10">
                  <LoadingSpinner className="text-ancient-icon-glow" size={36} label="Loading messages..." />
                </div>
              );
            }

            if (filteredMessages.length === 0 && !isLoading && !isFetchingNextPage) {
              return (
                <EmptyState
                  icon={MdChat}
                  title={`No messages with ${currentChatUser?.name || "this contact"}`}
                  description="Be the first to say hello! Your conversation starts here."
                  className="bg-transparent"
                />
              );
            }

            // Using the robust generalized clustering logic from chatHelpers
            const clusteredBlocks = clusterMessages(filteredMessages);

            return clusteredBlocks.map((clusterObj, idx) => {
              const clusterArray = clusterObj?.messages;
              if (!Array.isArray(clusterArray) || clusterArray.length === 0) return null;

              const isAllImages = clusterArray.length > 1 && clusterArray.every(m => m.type === 'image');
              const anchorMessage = clusterArray[0];
              const isIncoming = Number(anchorMessage?.senderId) !== Number(userInfo?.id);


              if (isAllImages) {
                return (
                  <ImageGridWrapper
                    key={`cluster-${anchorMessage.id || idx}`}
                    messagesArray={clusterArray}
                    isIncoming={isIncoming}
                    selectMode={selectMode}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                    onReply={handleReply}
                    onForward={handleForward}
                    chatMessages={filteredMessages}
                  />
                );
              }

              // Otherwise it maps exactly to the classic MessageWrapper for individual elements
              return clusterArray.map((msg, msgIdx) => (
                <MessageWrapper
                  key={msg.id || `msg-${idx}-${msgIdx}`}
                  message={msg}
                  isIncoming={isIncoming}
                  selectMode={selectMode}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onReply={handleReply}
                  onForward={handleForward}
                />
              ));
            });
          })()}

        </div>
      </div>
      {/* Jump to latest (icon button) - Fixed positioning for consistent placement */}
      {showJump && (
        <button
          type="button"
          onClick={jumpToLatest}
          title="Jump to latest"
          aria-label="Jump to latest"
          className="fixed right-4 md:right-6 bottom-36 md:bottom-40 z-30 pointer-events-auto w-12 h-12 md:w-13 md:h-13 rounded-full flex items-center justify-center bg-ancient-icon-glow text-ancient-bg-dark shadow-xl hover:shadow-2xl hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
        >
          <MdArrowDownward className="text-2xl" />
        </button>
      )}

      {/* Forward modal */}
      <ForwardModal
        open={showForward}
        onClose={() => {
          setShowForward(false);
          setSelectedIds([]);
          setSelectMode(false);
        }}
        fromUserId={userInfo?.id}
        initialMessageIds={selectedIds}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteMessageModal
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onDelete={handleBulkDelete}
          isDeletingForMe={isDeletingForMe}
          isDeletingForEveryone={isDeletingForEveryone}
          showForEveryoneButton={canDeleteForEveryone}
          title={`Delete ${selectedIds.length} Messages?`}
          description={null}
        />
      )}
    </div>
  );
}

export default ChatContainer;
