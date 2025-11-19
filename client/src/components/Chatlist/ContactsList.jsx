"use client";
import React, { useState, useMemo } from "react";
import { BiArrowBack, BiSearchAlt2 } from "react-icons/bi";
import ChatListItem from "./ChatLIstItem";
import { useChatStore } from "@/stores/chatStore";
import { useAllContacts } from "@/hooks/queries/useAllContacts";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";

function ContactsList() {
  const [search, setSearch] = useState("");
  const setAllContactsPage = useChatStore((s) => s.setAllContactsPage);
  const { data: sections = {}, isLoading, error, refetch } = useAllContacts();

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

  return (
    <div className="h-full flex flex-col bg-bg-secondary">
      <div className="h-24 flex items-end px-3 py-4 bg-bg-main border-b border-conversation-border">
        <div className="flex items-center gap-12 text-text-primary">
          <BiArrowBack className="cursor-pointer text-xl" onClick={() => setAllContactsPage(false)} />
          <span>New Chat</span>
        </div>
      </div>

      <div className="bg-bg-secondary flex py-3 pl-5 items-center gap-3 h-14 border-b border-conversation-border">
        <div className="bg-bg-main flex items-center gap-5 px-3 py-1 rounded-lg flex-grow">
          <div>
            <BiSearchAlt2 className="text-icon-active cursor-pointer text-lg" />
          </div>
          <div>
            <input
              type="text"
              placeholder="Search or start a new chat"
              className="bg-transparent text-sm focus:outline-none text-text-primary placeholder:text-text-secondary w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <LoadingSpinner label="Loading contacts..." className="px-4 py-6 text-text-primary" />
        ) : error ? (
          <div className="px-4 py-6 flex items-center gap-3 text-text-primary">
            <ErrorMessage message="Failed to load contacts" />
            <button
              type="button"
              className="bg-user-bubble hover:bg-other-bubble text-text-primary text-sm px-3 py-1 rounded transition-colors"
              onClick={() => refetch()}
            >
              Retry
            </button>
          </div>
        ) : Object.keys(filteredSections).length === 0 ? (
          <div className="text-text-secondary text-sm px-4 py-6">No contacts found</div>
        ) : (
          Object.keys(filteredSections)
            .sort()
            .map((letter) => (
              <div key={letter}>
                <div className="px-4 py-2 text-xs text-text-secondary">{letter}</div>
                <ul>
                  {filteredSections[letter].map((u) => (
                    <li key={u.id || u.email} className="border-b border-conversation-border/50">
                      <ChatListItem
                        isContactsPage
                        data={{
                          ...u,
                          profilePicture: u.image || "/default_avatar.png",
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

export default ContactsList;
