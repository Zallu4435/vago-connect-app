"use client";
import React, { useState, useCallback, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import MessageWrapper from "./MessageWrapper";
import ImageGridWrapper from "./ImageGridWrapper";
import dynamic from "next/dynamic";
import SelectMessagesBar from "./SelectMessagesBar";
import { showToast } from "@/lib/toast";

const ForwardModal = dynamic(() => import("./ForwardModal"), { ssr: false });
import { useMessagesPaginated } from "@/hooks/queries/useMessagesPaginated";
import { useDeleteMessage } from "@/hooks/mutations/useDeleteMessage";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyChatState from "./EmptyChatState";
import { MdArrowDownward } from "react-icons/md";
import DeleteMessageModal from "@/components/common/DeleteMessageModal";

function ChatContainer() {
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const userInfo = useAuthStore((s) => s.userInfo);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showForward, setShowForward] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const setMessages = useChatStore((s) => s.setMessages);
  const messages = useChatStore((s) => s.messages);
  const containerRef = useRef(null);
  const topSentinelRef = useRef(null);
  const messagesEndRef = useRef(null);

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

  // When the user changes, clear out messages and selection state so it doesn't bleed.
  useEffect(() => {
    setMessages([]);
    setSelectMode(false);
    setSelectedIds([]);
  }, [currentChatUser?.id, setMessages]);

  useEffect(() => {
    if (!Array.isArray(mergedMessages)) return;
    setMessages((prev = []) => {
      const byId = new Map();
      mergedMessages.forEach((m) => byId.set(m.id, m));
      (prev || []).forEach((m) => {
        if (!byId.has(m.id)) byId.set(m.id, m);
      });
      const out = Array.from(byId.values());
      out.sort((a, b) => new Date(a.timestamp || a.createdAt || 0) - new Date(b.timestamp || b.createdAt || 0));
      return out;
    });
  }, [mergedMessages, setMessages]);

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
    const storeAll = Array.isArray(messages) ? messages : [];
    const pages = pagesData?.pages || [];
    const fallbackAll = pages.flatMap((p) => p.messages) || [];
    const all = storeAll.length > 0 ? storeAll : fallbackAll;
    return all.filter((m) => !isDeletedForUser(m, userInfo?.id));
  }, [messages, pagesData, isDeletedForUser, userInfo?.id]);

  // Preserve scroll position when loading older messages (pagination)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !loadingOlderRef.current) return;

    // Scroll position is automatically preserved by the browser when new content
    // is added at the top, so we just reset the flag
    loadingOlderRef.current = false;
  }, [messages]);

  // Auto-scroll to bottom using modern pattern with useLayoutEffect
  // This runs synchronously before browser paint, preventing flicker
  useLayoutEffect(() => {
    if (!messagesEndRef.current) return;

    const currentLen = Array.isArray(messages) ? messages.length : 0;
    const lastMessage = currentLen > 0 ? messages[currentLen - 1] : null;
    const isNewMessageAdd = currentLen > prevMessagesLengthRef.current;

    // Update ref for next render
    prevMessagesLengthRef.current = currentLen;

    const isMyMessage = lastMessage && String(lastMessage.senderId) === String(userInfo?.id);

    // Force scroll if it's a new message that the current user just sent
    const forceScroll = isNewMessageAdd && isMyMessage;

    if (!shouldAutoScrollRef.current && !forceScroll) return;

    // Smooth scroll to the sentinel element at the end of messages
    messagesEndRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    });
  }, [messages, userInfo?.id]);

  // Reset auto-scroll when chat changes and scroll to bottom immediately
  useEffect(() => {
    shouldAutoScrollRef.current = true;

    if (messagesEndRef.current) {
      // Instant scroll on chat change (no smooth behavior)
      messagesEndRef.current.scrollIntoView({
        behavior: 'instant',
        block: 'end'
      });
    }
  }, [currentChatUser?.id]);

  const setReplyTo = useChatStore((s) => s.setReplyTo);
  const handleReply = useCallback((message) => {
    setReplyTo(message);
  }, [setReplyTo]);
  const handleForward = useCallback((message) => {
    setSelectedIds([message.id]);
    setShowForward(true);
  }, []);
  const toggleSelect = useCallback((id) => {
    // Check if the message is already deleted
    const message = filteredMessages.find(m => m.id === id);
    if (!message) return;
    if (message.isDeletedForEveryone || isDeletedForUser(message, userInfo?.id)) {
      showToast.error("Cannot select a deleted message");
      return;
    }

    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 50) { // arbitrary higher limit for deletes/copy, but forward limits might apply elsewhere
        showToast.info("You can select up to 50 messages at once");
        return prev;
      }
      return [...prev, id];
    });
  }, [filteredMessages, isDeletedForUser, userInfo?.id]);

  const handleBulkCopy = useCallback(async () => {
    if (selectedIds.length === 0) return;
    const selectedMsgs = filteredMessages
      .filter(m => selectedIds.includes(m.id))
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
    try {
      await Promise.all(selectedIds.map(id => delMutation.mutateAsync({ id, deleteType })));
      showToast.success(`Deleted ${selectedIds.length} messages`);
    } catch (e) {
      console.error("Bulk delete error", e);
      showToast.error("Failed to delete some messages");
    } finally {
      setShowDeleteConfirm(false);
      setSelectMode(false);
      setSelectedIds([]);
    }
  }, [selectedIds, delMutation]);

  // Determine if ALL selected messages belong to the current user
  const canDeleteForEveryone = useMemo(() => {
    if (selectedIds.length === 0) return false;
    const selectedMsgs = filteredMessages.filter(m => selectedIds.includes(m.id));
    return selectedMsgs.every(m => String(m.senderId) === String(userInfo?.id));
  }, [selectedIds, filteredMessages, userInfo?.id]);

  const onScroll = useCallback((e) => {
    const el = e.currentTarget;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);

    // Show "Go to Bottom" button if user scrolled up more than 150px
    const shouldShowButton = distanceFromBottom > 150;
    setShowJump(shouldShowButton);

    // Update auto-scroll behavior: only auto-scroll if user is near bottom
    shouldAutoScrollRef.current = distanceFromBottom <= 150;
  }, []);
  useEffect(() => {
    const el = topSentinelRef.current;
    const scroller = containerRef.current;
    if (!el || !scroller) return;

    const obs = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting && hasNextPage && !isFetchingNextPage) {
        loadingOlderRef.current = true;
        fetchNextPage();
      }
    }, { root: scroller, threshold: 0.01, rootMargin: '100px 0px 0px 0px' });

    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const jumpToLatest = useCallback(() => {
    if (!messagesEndRef.current) return;

    // Re-enable auto-scroll and scroll to bottom
    shouldAutoScrollRef.current = true;
    messagesEndRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    });
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="h-full w-full flex-1 relative overflow-auto pb-28 custom-scrollbar bg-transparent text-ancient-text-light"
    >
      {/* Optional: floating background visuals */}
      <div className="bg-chat-background bg-fixed h-full w-full opacity-[0.04] fixed left-0 top-0 z-0 pointer-events-none"></div>

      <div className="flex w-full">
        <div className="flex flex-col justify-end w-full gap-3 px-2 sm:px-4 py-3">
          {/* Sticky sentinel for pagination */}
          <div className="sticky top-0 z-10 flex justify-center pointer-events-none">
            <div ref={topSentinelRef} className="h-6">
              {isFetchingNextPage && (
                <LoadingSpinner className="text-ancient-text-muted" size={16} label="Loading older messages…" />
              )}
            </div>
          </div>
          {/* Select messages control bar (sticky) */}
          {filteredMessages.length > 0 && (
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
            // It's initial loading if we have no pages Data OR we are fetching the first page and have no messages yet
            const hasData = pagesData && pagesData.pages && pagesData.pages.length > 0;
            const isInitialLoading = !hasData || (filteredMessages.length === 0 && isFetchingNextPage);

            if (isInitialLoading) {
              return (
                <div className="absolute inset-0 flex flex-col items-center justify-center h-full w-full pointer-events-none z-10">
                  <LoadingSpinner className="text-ancient-icon-glow" size={36} label="Loading messages..." />
                </div>
              );
            }

            if (filteredMessages.length === 0 && !isFetchingNextPage) {
              return <EmptyChatState currentChatUser={currentChatUser} />;
            }

            // Clustering algorithm: group consecutive image messages
            const clusterMessages = (messagesArr) => {
              const clusters = [];
              let currentGroup = null;

              for (let i = 0; i < messagesArr.length; i++) {
                const msg = messagesArr[i];

                // Eligibility for Grid Clustering
                const isEligibleImage =
                  msg.type === "image" &&
                  !msg.caption &&
                  !msg.replyToMessageId &&
                  !msg.quotedMessage &&
                  !msg.isForwarded &&
                  !msg.isDeletedForEveryone;

                if (isEligibleImage) {
                  if (!currentGroup) {
                    // Start a new group
                    currentGroup = [msg];
                  } else {
                    const lastMsg = currentGroup[currentGroup.length - 1];
                    const timeDiff = Math.abs(new Date(msg.createdAt).getTime() - new Date(lastMsg.createdAt).getTime());

                    // Must be same sender, same message type, and within 60 seconds
                    const isSameSender = String(msg.senderId) === String(lastMsg.senderId);
                    const isWithinTimeWindow = timeDiff <= 60000;

                    if (isSameSender && isWithinTimeWindow) {
                      currentGroup.push(msg); // Add to existing cluster
                    } else {
                      // Close current group and start a new one
                      clusters.push(currentGroup);
                      currentGroup = [msg];
                    }
                  }
                } else {
                  // If not an eligible image, close any active group and push the singleton message
                  if (currentGroup) {
                    clusters.push(currentGroup);
                    currentGroup = null;
                  }
                  clusters.push([msg]); // Always chunked into an array internally for unified mapping
                }
              }

              // Push any tailing group
              if (currentGroup) {
                clusters.push(currentGroup);
              }

              return clusters;
            };

            const clusteredBlocks = clusterMessages(filteredMessages);

            return clusteredBlocks.map((clusterArray, idx) => {
              const anchorMessage = clusterArray[0];
              const isIncoming = Number(anchorMessage.senderId) !== Number(userInfo?.id);

              // If it's a cluster of >1 eligible images, mount the Grid Wrapper
              if (clusterArray.length > 1) {
                return (
                  <ImageGridWrapper
                    key={`cluster-${anchorMessage.id}`}
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

              // Otherwise it maps exactly to the classic MessageWrapper for single elements
              return (
                <MessageWrapper
                  key={anchorMessage.id}
                  message={anchorMessage}
                  isIncoming={isIncoming}
                  selectMode={selectMode}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onReply={handleReply}
                  onForward={handleForward}
                />
              );
            });
          })()}

          {/* Scroll sentinel - target for auto-scroll */}
          <div ref={messagesEndRef} className="h-1" aria-hidden="true" />


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
          isPending={delMutation.isPending}
          showForEveryoneButton={canDeleteForEveryone}
          title={`Delete ${selectedIds.length} Messages?`}
          description={null}
        />
      )}
    </div>
  );
}

export default ChatContainer;
