"use client";
import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import MessageActions from "./MessageActions";
import ForwardModal from "./ForwardModal";
import SelectMessagesBar from "./SelectMessagesBar";
import { showToast } from "@/lib/toast";
import { useMessagesPaginated } from "@/hooks/queries/useMessagesPaginated";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import TextMessage from "./messages/TextMessage";
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
  const prevScrollHeightRef = useRef(0);
  const prevScrollTopRef = useRef(0);
  const loadingOlderRef = useRef(false);
  const initialScrolledRef = useRef(false);
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

  // Scroll preservation and pin-to-bottom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (loadingOlderRef.current) {
      const newScrollHeight = el.scrollHeight;
      const delta = newScrollHeight - prevScrollHeightRef.current;
      el.scrollTop = prevScrollTopRef.current + delta;
      loadingOlderRef.current = false;
    }
  }, [messages]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    const nearBottom = distanceFromBottom <= 120;
    if (!initialScrolledRef.current) {
      el.scrollTop = el.scrollHeight;
      initialScrolledRef.current = true;
      return;
    }
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    initialScrolledRef.current = false;
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
    setShowJump(distanceFromBottom > 240);
  }, []);
  useEffect(() => {
    const el = topSentinelRef.current;
    const scroller = containerRef.current;
    if (!el || !scroller) return;
    const obs = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting && hasNextPage && !isFetchingNextPage) {
        prevScrollHeightRef.current = scroller.scrollHeight;
        prevScrollTopRef.current = scroller.scrollTop;
        loadingOlderRef.current = true;
        fetchNextPage();
      }
    }, { root: scroller, threshold: 0.01 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const jumpToLatest = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="h-[80vh] w-full flex-grow relative overflow-auto custom-scrollbar bg-ancient-bg-dark text-ancient-text-light"
    >
      {/* Optional: floating background visuals */}
      <div className="bg-chat-background bg-fixed h-full w-full opacity-[0.04] fixed left-0 top-0 z-0 pointer-events-none"></div>

      <div className="flex w-full">
        <div className="flex flex-col justify-end w-full gap-3 overflow-auto px-2 sm:px-4 py-3">
          {/* Sticky sentinel for pagination */}
          <div className="sticky top-0 z-10 flex justify-center pointer-events-none">
            <div ref={topSentinelRef} className="h-6">
              {isFetchingNextPage && (
                <LoadingSpinner className="text-ancient-text-muted" size={16} label="Loading older messages…" />
              )}
            </div>
          </div>
          {/* Message stack */}
          {(() => {
            const storeAll = Array.isArray(messages) ? messages : [];
            const fallbackAll = Array.isArray(mergedMessages) ? mergedMessages : [];
            const all = storeAll.length > 0 ? storeAll : fallbackAll;
            const filtered = all.filter((m) => !isDeletedForUser(m, userInfo?.id));
            return filtered.map((message, idx) => {
              const isIncoming = Number(message.senderId) === Number(currentChatUser?.id);
              return (
                <div 
                  key={message.id}
                  className={`relative w-full flex ${isIncoming ? 'justify-start' : 'justify-end'} py-1`}
                >
                  {/* Selection checkbox when selectMode is on */}
                  {selectMode && (
                    <input
                      type="checkbox"
                      className="mr-2 sm:mr-3 mt-2 form-checkbox h-4 w-4 sm:h-5 sm:w-5 text-ancient-icon-glow border-ancient-border-stone rounded focus:ring-0 cursor-pointer flex-shrink-0"
                      checked={selectedIds.includes(message.id)}
                      onChange={() => toggleSelect(message.id)}
                    />
                  )}

                  {/* Message components */}
                  {message.type === "text" && (
                    <div className="relative w-full max-w-full">
                      <TextMessage message={message} isIncoming={isIncoming} />
                      <MessageActions message={message} isIncoming={isIncoming} />
                    </div>
                  )}

                  {message.type === "image" && (
                    <div className="relative w-full max-w-full">
                      <ImageMessage message={message} />
                      <MessageActions message={message} isIncoming={isIncoming} />
                    </div>
                  )}

                  {message.type === "audio" && (
                    <div className="relative w-full max-w-full">
                      <AudioMessage message={message} isIncoming={isIncoming} />
                      <MessageActions message={message} isIncoming={isIncoming} />
                    </div>
                  )}

                  {message.type === "video" && (
                    <div className="relative w-full max-w-full">
                      <VideoMessage message={message} />
                      <MessageActions message={message} isIncoming={isIncoming} />
                    </div>
                  )}

                  {(message.type === "document" || (!['text', 'image', 'audio', 'video', 'location'].includes(String(message.type || '')))) && (
                    <div className="relative w-full max-w-full">
                      <DocumentMessage message={message} />
                      <MessageActions message={message} isIncoming={isIncoming} />
                    </div>
                  )}
                </div>
              );
            });
          })()}

          {/* Selection bar for forwarding */}
          <SelectMessagesBar
            selectMode={selectMode}
            selectedCount={selectedIds.length}
            onToggleSelect={() => setSelectMode((v) => !v)}
            onCancel={() => { setSelectMode(false); setSelectedIds([]); }}
            onForward={() => setShowForward(true)}
          />
        </div>
      </div>
      {/* Jump to latest button */}
      {showJump && (
        <button
          type="button"
          onClick={jumpToLatest}
          className="absolute right-4 bottom-24 z-20 bg-ancient-icon-glow text-ancient-bg-dark px-3 py-2 rounded-full shadow-lg hover:bg-ancient-bubble-user transition-colors"
        >
          Jump to latest
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
