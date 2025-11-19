"use client";
import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { IoClose } from "react-icons/io5";
import { BiSearchAlt2 } from "react-icons/bi";
import { calculateTime } from "@/utils/CalculateTime";
import { useChatStore } from "@/stores/chatStore";
import { FaAngleUp, FaAngleDown } from "react-icons/fa"; // Added for navigation

// Helper function to get thematic day labels
function getThematicDayLabel(dateStr) {
  try {
    const messageDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today's Whispers";
    }
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday's Echoes";
    }

    // For older messages, format as "Month Day, Year"
    return messageDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Ancient Times"; // Fallback for invalid dates
  }
}

function SearchMessages() {
  const messages = useChatStore((s) => s.messages);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const messageRefs = useRef([]); // To store refs for scrolling
  const messagesEndRef = useRef(null); // Ref for initial scroll to bottom

  // Filter and sort messages based on search term, oldest first for display
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const list = Array.isArray(messages) ? messages : [];
    const results = list.filter((m) => String(m.content || "").toLowerCase().includes(term));
    // Sort chronologically for better reading in search results
    return results.sort((a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp));
  }, [messages, searchTerm]);

  // Group messages by thematic day label
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((m) => {
      const label = getThematicDayLabel(m.timestamp || m.createdAt || new Date().toISOString());
      if (!groups[label]) groups[label] = [];
      groups[label].push(m);
    });
    return groups;
  }, [filtered]);

  // Scroll to highlighted message
  useEffect(() => {
    if (highlightedIndex !== -1 && messageRefs.current[highlightedIndex]) {
      messageRefs.current[highlightedIndex].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightedIndex]);

  // Scroll to the latest messages when search opens or term clears
  useEffect(() => {
    if (!searchTerm && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    setHighlightedIndex(-1); // Reset highlight on search term change
  }, [searchTerm]);

  const navigateResults = useCallback((direction) => {
    if (filtered.length === 0) return;
    setHighlightedIndex((prevIndex) => {
      let newIndex = prevIndex + direction;
      if (newIndex < 0) return filtered.length - 1; // Wrap around to end
      if (newIndex >= filtered.length) return 0; // Wrap around to start
      return newIndex;
    });
  }, [filtered.length]);


  return (
    <div className="fixed inset-0 lg:left-auto lg:w-[400px] bg-ancient-bg-dark flex flex-col z-40 shadow-xl border-l border-ancient-border-stone animate-slide-in-right">
      {/* Header */}
      <div className="h-20 px-6 flex gap-6 items-center bg-ancient-bg-medium text-ancient-text-light border-b border-ancient-border-stone shadow-md">
        <IoClose
          className="cursor-pointer text-ancient-icon-inactive hover:text-ancient-icon-glow transition-colors duration-200 text-3xl"
          onClick={() => useChatStore.setState({ messageSearch: false })}
          title="Close Search"
        />
        <span className="text-xl font-bold">Search Ancient Whispers</span>
      </div>

      {/* Search Input */}
      <div className="px-6 py-4 bg-ancient-bg-medium border-b border-ancient-border-stone shadow-inner">
        <div className="flex items-center gap-4 bg-ancient-input-bg border border-ancient-input-border rounded-lg px-4 py-2 focus-within:border-ancient-icon-glow transition-all duration-300">
          <BiSearchAlt2 className="text-ancient-icon-inactive text-2xl" />
          <input
            type="text"
            placeholder="Seek ancient scrolls..."
            className="bg-transparent text-base focus:outline-none text-ancient-text-light placeholder:text-ancient-text-muted w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-ancient-icon-inactive hover:text-red-400">
              <IoClose className="text-2xl" /> {/* Reusing IoClose for clear button */}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Controls for Results */}
      {filtered.length > 0 && searchTerm && (
        <div className="flex justify-end items-center gap-4 px-6 py-2 bg-ancient-bg-medium border-b border-ancient-border-stone text-ancient-text-light text-sm">
          <span>
            {highlightedIndex === -1 ? 0 : highlightedIndex + 1} of {filtered.length} results
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => navigateResults(-1)}
              className="bg-ancient-input-bg border border-ancient-input-border p-2 rounded-full hover:bg-ancient-bubble-user-light transition-colors duration-200 text-ancient-icon-glow disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={filtered.length === 0}
            >
              <FaAngleUp className="text-lg" />
            </button>
            <button
              onClick={() => navigateResults(1)}
              className="bg-ancient-input-bg border border-ancient-input-border p-2 rounded-full hover:bg-ancient-bubble-user-light transition-colors duration-200 text-ancient-icon-glow disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={filtered.length === 0}
            >
              <FaAngleDown className="text-lg" />
            </button>
          </div>
        </div>
      )}

      {/* Message Results */}
      <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-6">
        {filtered.length === 0 && (
          <div className="text-ancient-text-muted text-center text-base py-4">
            No ancient whispers match your quest.
          </div>
        )}

        {Object.entries(grouped).map(([label, items]) => (
          <div key={label} className="space-y-3">
            <div className="sticky top-0 z-10 text-ancient-text-muted text-sm text-center bg-ancient-bg-dark py-1 rounded-md mb-2 border-b border-ancient-border-stone">
              {label}
            </div>
            {items.map((m, indexInFiltered) => {
              const globalIndex = filtered.findIndex(f => f.id === m.id); // Get global index for highlighting
              return (
                <div
                  key={m.id}
                  ref={(el) => (messageRefs.current[globalIndex] = el)} // Store ref
                  className={`relative px-4 py-3 text-sm rounded-lg max-w-[95%] shadow-md ${
                    m.senderId === useChatStore.getState().currentChatUser?.id // Assuming senderId is how you differentiate incoming/outgoing
                      ? 'bg-ancient-bubble-user self-start mr-auto' // Incoming
                      : 'bg-ancient-bubble-other self-end ml-auto' // Outgoing
                  } ${
                    highlightedIndex === globalIndex ? 'ring-2 ring-ancient-icon-glow' : ''
                  } transition-all duration-2300`}
                >
                  <span className="text-ancient-text-light break-all">{m.content}</span>
                  <span className="absolute bottom-1 right-2 text-[10px] text-ancient-text-muted ml-2">
                    {calculateTime(m.timestamp || m.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
        {/* Placeholder to ensure scroll to bottom works initially */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default SearchMessages;