"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IoClose } from "react-icons/io5";
import { BiSearchAlt2 } from "react-icons/bi";
import { calculateTime } from "@/utils/CalculateTime";
import { useChatStore } from "@/stores/chatStore";
import { FaAngleUp, FaAngleDown } from "react-icons/fa";
import { getThematicDayLabel } from "@/utils/dateLabels";
import { MdImage, MdVideocam, MdAudiotrack, MdInsertDriveFile, MdLocationOn } from "react-icons/md";
import { useDebounce } from "@/hooks/useDebounce";

function SearchMessages() {
  const messages = useChatStore((s) => s.messages);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const messageRefs = useRef([]);

  const filtered = useMemo(() => {
    const term = debouncedSearchTerm.trim().toLowerCase();
    if (!term) return [];

    const list = Array.isArray(messages) ? messages : [];
    const results = list.filter((m) => {
      // For media, the content is a URL, so we search the caption or filename instead if possible
      const searchableText = String(m.type === "text" ? m.content : (m.caption || m.fileName || m.type || "")).toLowerCase();
      return searchableText.includes(term);
    });
    return results.sort(
      (a, b) =>
        new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp)
    );
  }, [messages, debouncedSearchTerm]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((m) => {
      const label = getThematicDayLabel(
        m.timestamp || m.createdAt || new Date().toISOString()
      );
      if (!groups[label]) groups[label] = [];
      groups[label].push(m);
    });
    return groups;
  }, [filtered]);

  useEffect(() => {
    if (highlightedIndex !== -1 && messageRefs.current[highlightedIndex]) {
      messageRefs.current[highlightedIndex].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightedIndex]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [debouncedSearchTerm]);

  const navigateResults = useCallback(
    (direction) => {
      if (filtered.length === 0) return;
      setHighlightedIndex((prevIndex) => {
        let newIndex = prevIndex + direction;
        if (newIndex < 0) return filtered.length - 1;
        if (newIndex >= filtered.length) return 0;
        return newIndex;
      });
    },
    [filtered.length]
  );

  return (
    <div className="
      fixed inset-0 lg:left-auto lg:w-[400px]
      bg-ancient-bg-dark flex flex-col z-40 shadow-xl border-l border-ancient-border-stone
      animate-slide-in-right
    ">
      {/* Header */}
      <div className="
        h-16 sm:h-20 px-4 sm:px-6 flex gap-4 sm:gap-6 items-center
        bg-ancient-bg-medium text-ancient-text-light border-b border-ancient-border-stone shadow-md
      ">
        <IoClose
          className="cursor-pointer text-ancient-icon-inactive hover:text-ancient-icon-glow transition-colors duration-200 text-3xl sm:text-4xl"
          onClick={() => useChatStore.setState({ messageSearch: false })}
          title="Close Search"
          role="button"
          tabIndex={0}
        />
        <span className="text-xl sm:text-2xl font-bold truncate">Search messages</span>
      </div>

      {/* Search Input */}
      <div className="px-4 sm:px-6 py-3 bg-ancient-bg-medium border-b border-ancient-border-stone shadow-inner">
        <div className="
          flex items-center gap-3 bg-ancient-input-bg border border-ancient-input-border
          rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus-within:border-ancient-icon-glow transition-all duration-300
        ">
          <BiSearchAlt2 className="text-ancient-icon-inactive text-2xl" />
          <input
            type="text"
            placeholder="Search messages..."
            className="bg-transparent text-base sm:text-lg focus:outline-none text-ancient-text-light placeholder:text-ancient-text-muted w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-ancient-icon-inactive hover:text-red-400 transition-colors duration-200"
              aria-label="Clear search"
            >
              <IoClose className="text-2xl" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Controls for Results */}
      {filtered.length > 0 && debouncedSearchTerm && (
        <div className="
          flex justify-end items-center gap-4 px-4 sm:px-6 py-2 bg-ancient-bg-medium border-b border-ancient-border-stone
          text-ancient-text-light text-sm sm:text-base
        ">
          <span>
            {highlightedIndex === -1 ? 0 : highlightedIndex + 1} of {filtered.length} results
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => navigateResults(-1)}
              className="
                bg-ancient-input-bg border border-ancient-input-border p-2 rounded-full
                hover:bg-ancient-bubble-user-light transition-colors duration-200
                text-ancient-icon-glow disabled:opacity-50 disabled:cursor-not-allowed
              "
              disabled={filtered.length === 0}
              aria-label="Previous result"
            >
              <FaAngleUp className="text-lg" />
            </button>
            <button
              onClick={() => navigateResults(1)}
              className="
                bg-ancient-input-bg border border-ancient-input-border p-2 rounded-full
                hover:bg-ancient-bubble-user-light transition-colors duration-200
                text-ancient-icon-glow disabled:opacity-50 disabled:cursor-not-allowed
              "
              disabled={filtered.length === 0}
              aria-label="Next result"
            >
              <FaAngleDown className="text-lg" />
            </button>
          </div>
        </div>
      )}

      {/* Message Results */}
      <div className="flex-grow flex flex-col overflow-y-auto custom-scrollbar p-2 sm:p-4 space-y-2">
        {filtered.length === 0 && debouncedSearchTerm && (
          <div className="text-ancient-text-muted text-center text-base sm:text-lg py-4">
            No results found.
          </div>
        )}

        {!debouncedSearchTerm && (
          <div className="flex flex-col items-center justify-center flex-grow text-ancient-text-muted">
            <BiSearchAlt2 className="text-6xl mb-4 opacity-50" />
            <p className="text-base sm:text-lg opacity-80">Search for messages, images, or files...</p>
          </div>
        )}

        {Object.entries(grouped).map(([label, items]) => (
          <div key={label} className="space-y-4">
            <div className="
              sticky top-0 z-10 text-ancient-text-muted text-xs sm:text-sm text-center
              bg-ancient-bg-dark py-1 rounded-md mb-2 border-b border-ancient-border-stone
            ">
              {label}
            </div>
            {items.map((m) => {
              const globalIndex = filtered.findIndex((f) => f.id === m.id);
              const isMe = m.senderId === useChatStore.getState().currentChatUser?.id;

              // Helper to display media concisely
              const getPreview = () => {
                if (m.type === "text") return m.content;
                const Icon = m.type === "image" ? MdImage :
                  m.type === "video" ? MdVideocam :
                    m.type === "audio" ? MdAudiotrack :
                      m.type === "location" ? MdLocationOn : MdInsertDriveFile;
                return (
                  <span className="flex items-center gap-2 italic text-ancient-text-muted">
                    <Icon className="text-lg" />
                    {m.caption || m.fileName || m.type.charAt(0).toUpperCase() + m.type.slice(1)}
                  </span>
                );
              };

              return (
                <div
                  key={m.id}
                  ref={(el) => (messageRefs.current[globalIndex] = el)}
                  onClick={() => {
                    // Jump to message in main chat window if requested, for now we scroll here
                    messageRefs.current[globalIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
                    setHighlightedIndex(globalIndex);
                  }}
                  className={`
                    flex flex-col gap-1 px-4 py-3 rounded-lg cursor-pointer
                    border border-transparent hover:border-ancient-border-stone hover:bg-ancient-bg-medium
                    ${highlightedIndex === globalIndex ? "bg-ancient-bubble-user-light border-ancient-icon-glow" : "bg-transparent"}
                    transition-all duration-200 w-full mb-2
                  `}
                >
                  <div className="flex justify-between items-end w-full">
                    <span className="text-xs font-semibold text-ancient-text-muted">
                      {isMe ? "You" : (m.sender?.firstName || "Friend")}
                    </span>
                    <span className="text-[10px] text-ancient-text-muted">
                      {calculateTime(m.timestamp || m.createdAt)}
                    </span>
                  </div>
                  <div className="text-sm text-ancient-text-light truncate break-all">
                    {getPreview()}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchMessages;
