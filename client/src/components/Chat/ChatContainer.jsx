"use client";
import React, { useState, useCallback, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import MessageWrapper from "./MessageWrapper";
import ForwardModal from "./ForwardModal";
import SelectMessagesBar from "./SelectMessagesBar";
import { showToast } from "@/lib/toast";
import { useMessagesPaginated } from "@/hooks/queries/useMessagesPaginated";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import TextMessage from "./messages/TextMessage";
import { MdArrowDownward } from "react-icons/md";
import ImageMessage from "./messages/ImageMessage";
import AudioMessage from "./messages/AudioMessage";
import VideoMessage from "./messages/VideoMessage";
import DocumentMessage from "./messages/DocumentMessage";

// VoiceMessage replaced by AudioMessage

function ChatContainer() {
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const userInfo = useAuthStore((s) => s.userInfo);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showForward, setShowForward] = useState(false);
  const setMessages = useChatStore((s) => s.setMessages);
  const messages = useChatStore((s) => s.messages);
  const containerRef = useRef(null);
  const topSentinelRef = useRef(null);
  const messagesEndRef = useRef(null); // Sentinel for auto-scroll
  const loadingOlderRef = useRef(false);
  const shouldAutoScrollRef = useRef(true); // Track if we should auto-scroll
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
    { limit: 50, markRead: true }
  );

  const mergedMessages = useMemo(() => {
    const pages = pagesData?.pages || [];
    return pages.flatMap((p) => p.messages);
  }, [pagesData]);

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
    if (!messagesEndRef.current || !shouldAutoScrollRef.current) return;

    // Smooth scroll to the sentinel element at the end of messages
    messagesEndRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    });
  }, [messages]);

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
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) {
        showToast.info("You can forward up to 5 messages at once");
        return prev;
      }
      return [...prev, id];
    });
  };
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
    }, { root: scroller, threshold: 0.01 });

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
          <SelectMessagesBar
            selectMode={selectMode}
            selectedCount={selectedIds.length}
            onToggleSelect={() => setSelectMode((v) => !v)}
            onCancel={() => { setSelectMode(false); setSelectedIds([]); }}
            onForward={() => setShowForward(true)}
          />
          {/* Message stack */}
          {(() => {
            const storeAll = Array.isArray(messages) ? messages : [];
            const fallbackAll = Array.isArray(mergedMessages) ? mergedMessages : [];
            const all = storeAll.length > 0 ? storeAll : fallbackAll;
            const filtered = all.filter((m) => !isDeletedForUser(m, userInfo?.id));
            return filtered.map((message, idx) => {
              const isIncoming = Number(message.senderId) === Number(currentChatUser?.id);
              return (
                <MessageWrapper
                  key={message.id}
                  message={message}
                  isIncoming={isIncoming}
                  selectMode={selectMode}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                >
                  {message.type === "text" && (
                    <TextMessage message={message} isIncoming={isIncoming} />
                  )}

                  {message.type === "image" && (
                    <ImageMessage message={message} isIncoming={isIncoming} />
                  )}

                  {message.type === "audio" && (
                    <AudioMessage message={message} isIncoming={isIncoming} />
                  )}

                  {message.type === "video" && (
                    <VideoMessage message={message} isIncoming={isIncoming} />
                  )}

                  {(message.type === "document" || (!['text', 'image', 'audio', 'video', 'location'].includes(String(message.type || '')))) && (
                    <DocumentMessage message={message} isIncoming={isIncoming} />
                  )}
                </MessageWrapper>
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
    </div>
  );
}

export default ChatContainer;
