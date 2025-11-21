"use client";
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { BiArrowBack, BiSearchAlt2 } from "react-icons/bi";
import { IoClose } from "react-icons/io5";
import { GiScrollUnfurled, GiOrbVault, GiMoon, GiMagicLamp } from "react-icons/gi"; // Mystical icons
import ChatListItem from "./ChatLIstItem"; // Assuming this is already themed
import { useChatStore } from "@/stores/chatStore";
import { useAllContactsPaginated } from "@/hooks/queries/useAllContactsPaginated";
import LoadingSpinner from "@/components/common/LoadingSpinner"; // Assuming this is themed
import ErrorMessage from "@/components/common/ErrorMessage"; // Assuming this is themed
import { useAuthStore } from "@/stores/authStore";
import { getAbsoluteUrl } from "@/lib/url";
import GroupCreateModal from "./GroupCreateModal"; // Modal for creating groups

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
  const sentinelRef = useRef(null); // For infinite scroll

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
    if (!hasNextPage || isLoading || isFetchingNextPage) return; // Prevent multiple fetches
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting) {
        fetchNextPage();
      }
    }, {
      rootMargin: "200px", // Load when 200px from bottom
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, fetchNextPage, isLoading, isFetchingNextPage]); // Added isLoading, isFetchingNextPage to dependencies


  // Callback to handle closing the group creation modal
  const handleCloseGroupCreate = useCallback(() => {
    setShowGroupCreate(false);
  }, []);

  return (
    <div className="h-full flex flex-col bg-ancient-bg-dark text-ancient-text-light">
      {/* Header */}
      <div className="h-24 flex flex-col justify-end pb-4 px-6 border-b border-ancient-border-stone shadow-md bg-ancient-bg-medium relative">
        <div className="flex items-center gap-6">
          <button
            className="text-ancient-text-light hover:text-ancient-icon-glow transition-colors duration-200"
            type="button"
            onClick={() => setAllContactsPage(false)}
            aria-label="Back to Chats"
          >
            <BiArrowBack className="text-2xl" />
          </button>
          <h2 className="text-2xl font-bold text-ancient-text-light">Contacts</h2>
        </div>
      </div>

      {/* Search Bar & New Group Button */}
      <div className="bg-ancient-bg-medium px-6 py-4 border-b border-ancient-border-stone flex flex-col gap-3">
        {/* Search Input */}
        <div className="relative flex items-center bg-ancient-input-bg border border-ancient-input-border rounded-full flex-grow px-4 py-2 shadow-inner focus-within:border-ancient-icon-glow transition-all duration-300">
          <BiSearchAlt2 className="text-ancient-icon-inactive text-xl mr-3" />
          <input
            type="text"
            placeholder="Search contacts..."
            className="bg-transparent text-base flex-1 focus:outline-none text-ancient-text-light placeholder:text-ancient-text-muted"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            spellCheck={false}
          />
          {localValue ? (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-2 w-7 h-7 flex items-center justify-center rounded-full hover:bg-ancient-bg-dark/40 transition-colors"
              onClick={() => { setLocalValue(""); }}
            >
              <IoClose className="text-ancient-icon-inactive text-lg" />
            </button>
          ) : null}
        </div>

        {/* New Group Button */
        }
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-ancient-bubble-user hover:bg-ancient-bubble-user-light text-ancient-text-light font-semibold transition-colors shadow-md"
          onClick={() => setShowGroupCreate(true)}
          title="New Group"
        >
          <GiMoon className="text-xl text-ancient-icon-glow" />
          <span className="text-base">New Group</span>
        </button>
      </div>

      {/* Contacts List Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading && !data?.pages?.length ? (
          <LoadingSpinner label="Loading contacts..." className="px-4 py-8 text-ancient-text-muted" />
        ) : error ? (
          <div className="mx-6 my-8 px-6 py-6 flex flex-col items-start gap-4 bg-ancient-warning-bg rounded-xl shadow-xl">
            <ErrorMessage message="Failed to load contacts." />
            <button
              type="button"
              className="bg-ancient-bubble-user hover:bg-ancient-bubble-user-light text-ancient-text-light text-sm px-4 py-2 rounded shadow-md transition-colors"
              onClick={refetch}
            >
              Retry
            </button>
          </div>
        ) : Object.keys(filteredSections).length === 0 ? (
          <div className="w-full py-8 text-center text-base text-ancient-text-muted">
            No contacts found.
          </div>
        ) : (
          Object.keys(filteredSections)
            .sort()
            .map((letter) => (
              <div key={letter}>
                <div className="sticky top-0 z-10 px-6 py-2 text-sm font-bold text-ancient-icon-glow bg-ancient-bg-dark/80 backdrop-blur-sm border-b border-ancient-border-stone/50">
                  {letter}
                </div>
                <ul>
                  {filteredSections[letter].map((u) => (
                    <li key={u.id || u.email}>
                      <ChatListItem
                        isContactsPage
                        data={{
                          ...u,
                          name: String(u?.id) === String(userInfo?.id) ? "You" : (u?.name || u?.username || "Unknown user"),
                          isSelf: String(u?.id) === String(userInfo?.id),
                          profilePicture: getAbsoluteUrl(u?.image || u?.profileImage) || "/default_avatar.png",
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))
        )}
        {hasNextPage && (
          <div ref={sentinelRef} className="w-full py-4 flex justify-center items-center">
            {isFetchingNextPage ? <LoadingSpinner label="Loading more contacts…" /> : null}
          </div>
        )}
      </div>

      {/* Group Create Modal */}
      {showGroupCreate && (
        <GroupCreateModal onClose={handleCloseGroupCreate} />
      )}
    </div>
  );
}

export default ContactsList;