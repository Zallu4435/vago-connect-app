"use client";
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { BiArrowBack, BiSearchAlt2 } from "react-icons/bi";
import { IoClose } from "react-icons/io5";
import { GiMoon } from "react-icons/gi";
import ChatListItem from "./ChatLIstItem";
import { useChatStore } from "@/stores/chatStore";
import { useAllContactsPaginated } from "@/hooks/queries/useAllContactsPaginated";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useAuthStore } from "@/stores/authStore";
import { getAbsoluteUrl } from "@/lib/url";
import dynamic from "next/dynamic";

const GroupCreateModal = dynamic(() => import("./GroupCreateModal"), { ssr: false });

function ContactsList() {
  const [search, setSearch] = useState("");
  const [localValue, setLocalValue] = useState("");
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const setAllContactsPage = useChatStore((s) => s.setAllContactsPage);
  const userInfo = useAuthStore((s) => s.userInfo);

  const {
    data,
    isLoading,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useAllContactsPaginated({ q: search, limit: 50, sort: "name_asc" });
  const sentinelRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => setSearch(localValue.trim()), 300);
    return () => clearTimeout(id);
  }, [localValue]);

  const sections = useMemo(() => {
    const pages = data?.pages || [];
    const merged = {};
    pages.forEach((p) => {
      const sec = p.sections || {};
      Object.keys(sec).forEach((letter) => {
        if (!merged[letter]) merged[letter] = [];
        merged[letter] = merged[letter].concat(sec[letter] || []);
      });
    });
    return merged;
  }, [data]);

  const filteredSections = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sections;
    const out = {};
    Object.keys(sections || {}).forEach((letter) => {
      const list = sections[letter] || [];
      const filtered = list.filter((u) => {
        const name = String(u?.name || u?.username || "").toLowerCase();
        const about = String(u?.about || "").toLowerCase();
        return name.includes(term) || about.includes(term);
      });
      if (filtered.length) out[letter] = filtered;
    });
    return out;
  }, [sections, search]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || isLoading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting) fetchNextPage();
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage, isLoading]);

  const handleCloseGroupCreate = useCallback(() => setShowGroupCreate(false), []);

  return (
    <div className="h-full flex flex-col bg-ancient-bg-dark text-ancient-text-light w-full">
      {/* Header */}
      <div className="flex flex-col justify-end pb-3 px-3 sm:px-6 border-b border-ancient-border-stone shadow-md bg-ancient-bg-medium relative h-16 sm:h-20">
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            className="text-ancient-text-light hover:text-ancient-icon-glow transition-colors duration-200"
            type="button"
            onClick={() => setAllContactsPage(false)}
            aria-label="Back to Chats"
          >
            <BiArrowBack className="text-lg sm:text-2xl" />
          </button>
          <h2 className="text-lg sm:text-2xl font-bold truncate">Contacts</h2>
        </div>
      </div>

      {/* Search Bar & New Group Button */}
      <div className="bg-ancient-bg-medium px-3 sm:px-6 py-3 sm:py-4 border-b border-ancient-border-stone flex flex-col gap-2">
        <div className="relative flex items-center bg-ancient-input-bg border border-ancient-input-border rounded-full flex-grow px-3 py-1.5 sm:px-4 sm:py-2 shadow-inner focus-within:border-ancient-icon-glow transition-all duration-300">
          <BiSearchAlt2 className="text-ancient-icon-inactive text-base sm:text-xl mr-2 sm:mr-3" />
          <input
            type="text"
            placeholder="Search contacts..."
            className="bg-transparent text-sm sm:text-base flex-1 focus:outline-none text-ancient-text-light placeholder:text-ancient-text-muted"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            spellCheck={false}
          />
          {localValue ? (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-2 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full hover:bg-ancient-bg-dark/40 transition-colors"
              onClick={() => setLocalValue("")}
            >
              <IoClose className="text-ancient-icon-inactive text-base sm:text-lg" />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 px-4 py-2 sm:py-3 rounded-lg bg-ancient-bubble-user hover:bg-ancient-bubble-user-light text-ancient-text-light font-semibold transition-colors shadow-md"
          onClick={() => setShowGroupCreate(true)}
          title="New Group"
        >
          <GiMoon className="text-base sm:text-xl text-ancient-icon-glow" />
          <span className="text-sm sm:text-base">New Group</span>
        </button>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        {isLoading && !data?.pages?.length ? (
          <div className="flex w-full justify-center mt-8">
            <LoadingSpinner key="loading" label="Loading contacts..." className="px-4 py-8 text-ancient-text-muted" />
          </div>
        ) : error ? (
          <div key="error" className="mx-3 sm:mx-6 my-6 px-4 sm:px-6 py-5 sm:py-6 flex flex-col items-start gap-4 bg-ancient-warning-bg rounded-lg sm:rounded-xl shadow-xl">
            <ErrorMessage message="Failed to load contacts." />
            <button
              type="button"
              className="bg-ancient-bubble-user hover:bg-ancient-bubble-user-light text-ancient-text-light text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded shadow-md transition-colors"
              onClick={refetch}
            >
              Retry
            </button>
          </div>
        ) : Object.keys(filteredSections).length === 0 ? (
          <div key="no-results" className="w-full py-8 text-center text-base text-ancient-text-muted">
            No contacts found.
          </div>
        ) : (
          <div key="contacts-grid">
            {Object.keys(filteredSections)
              .sort()
              .map((letter) => (
                <div key={letter}>
                  <div className="sticky top-0 z-10 px-3 sm:px-6 py-1 sm:py-2 text-sm sm:text-base font-bold text-ancient-icon-glow bg-ancient-bg-dark/80 backdrop-blur-sm border-b border-ancient-border-stone/50">
                    {letter}
                  </div>
                  <ul>
                    {filteredSections[letter].map((u) => (
                      <li key={u.id || u.email}>
                        <ChatListItem
                          isContactsPage
                          data={{
                            ...u,
                            name: u?.name || u?.username || "Unknown user",
                            isSelf: String(u?.id) === String(userInfo?.id),
                            profilePicture: getAbsoluteUrl(u?.image || u?.profileImage) || "/default_avatar.png",
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        )}
        {hasNextPage && (
          <div ref={sentinelRef} className="w-full py-4 flex justify-center items-center">
            {isFetchingNextPage ? <LoadingSpinner key="loading-more" label="Loading more contacts…" /> : null}
          </div>
        )}
      </div>

      {/* Group Create Modal */}
      {showGroupCreate && (
        <GroupCreateModal open={showGroupCreate} onClose={handleCloseGroupCreate} />
      )}
    </div>
  );
}

export default ContactsList;
