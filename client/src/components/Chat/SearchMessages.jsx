"use client";
import React, { useMemo, useState } from "react";
import { IoClose } from "react-icons/io5";
import { BiSearchAlt2 } from "react-icons/bi";
import { calculateTime } from "@/utils/CalculateTime";
import { useChatStore } from "@/stores/chatStore";

function dayLabel(dateStr) {
  try {
    const label = calculateTime(dateStr);
    if (label === "Yesterday") return label;
    // calculateTime returns time like '10:25 AM' for today
    if (/\d/.test(label) && label.includes(":")) return "Today";
    return label;
  } catch {
    return "";
  }
}

function SearchMessages() {
  const messages = useChatStore((s) => s.messages);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const list = Array.isArray(messages) ? messages : [];
    if (!term) return list.slice(-50).reverse();
    return list.filter((m) => String(m.content || "").toLowerCase().includes(term)).reverse();
  }, [messages, searchTerm]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((m) => {
      const label = dayLabel(m.timestamp || m.createdAt || new Date().toISOString());
      if (!groups[label]) groups[label] = [];
      groups[label].push(m);
    });
    return groups;
  }, [filtered]);

  return (
    <div className="border-conversation-border border-l w-full bg-conversation-panel-background flex-col z-10 max-h-screen">
      <div className="h-16 px-4 py-5 flex gap-10 items-center bg-panel-header-background text-primary-strong">
        <IoClose
          className="cursor-pointer text-icon-lighter text-2xl"
          onClick={() => useChatStore.setState({ messageSearch: false })}
        />
        <span>Search Messages</span>
      </div>
      <div className="overflow-auto custom-scrollbar h-full">
        <div className="flex items-center flex-col w-full">
          <div className="flex px-5 items-center gap-3 h-14 w-full">
            <div className="bg-panel-header-background flex items-center gap-3 px-3 py-1 rounded-lg flex-grow">
              <BiSearchAlt2 className="text-panel-header-icon text-xl" />
              <input
                type="text"
                placeholder="Search"
                className="bg-transparent text-sm focus:outline-none text-white placeholder:text-secondary w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full px-6 py-3 space-y-6">
            {Object.keys(grouped).length === 0 && (
              <div className="text-secondary text-sm px-2">No results</div>
            )}
            {Object.entries(grouped).map(([label, items]) => (
              <div key={label} className="space-y-2">
                <div className="text-secondary text-sm px-2">{label}</div>
                {items.map((m) => (
                  <div
                    key={m.id}
                    className="text-white px-3 py-2 text-sm rounded-md max-w-[90%] bg-conversation-panel-background"
                  >
                    <span className="break-all">{m.content}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchMessages;
