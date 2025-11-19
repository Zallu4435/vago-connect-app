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
    <div className="h-full flex flex-col bg-ancient-bg-dark">
      {/* Header */}
      <div className="h-20 flex items-center px-6 border-b border-ancient-border-stone shadow-md bg-ancient-bg-medium">
        <button className="flex items-center gap-8 text-ancient-text-light bg-transparent" type="button" onClick={() => setAllContactsPage(false)}>
          <BiArrowBack className="text-2xl cursor-pointer hover:text-ancient-icon-glow transition-colors duration-200" />
          <span className="text-xl font-bold ml-1">Summon Contacts</span>
        </button>
      </div>
      {/* Search Bar */}
      <div className="bg-ancient-bg-medium flex items-center py-3 px-6 border-b border-ancient-border-stone">
        <div className="flex items-center bg-ancient-input-bg border border-ancient-input-border rounded-full flex-grow px-4 py-2 shadow-inner focus-within:border-ancient-icon-glow transition-all duration-300">
          <BiSearchAlt2 className="text-ancient-icon-inactive text-xl mr-3" />
          <input
            type="text"
            placeholder="Search for entities or echoes..."
            className="bg-transparent text-base flex-1 focus:outline-none text-ancient-text-light placeholder:text-ancient-text-muted"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            spellCheck={false}
          />
        </div>
      </div>
      {/* Contacts List Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <LoadingSpinner label="Unearthing ancient contacts..." className="px-4 py-8 text-ancient-text-muted" />
        ) : error ? (
          <div className="mx-6 my-8 px-6 py-6 flex flex-col items-start gap-4 bg-ancient-warning-bg rounded-xl shadow-xl">
            <ErrorMessage message="Failed to decipher ancient scrolls." />
            <button
              type="button"
              className="bg-ancient-bubble-user hover:bg-ancient-bubble-user-light text-ancient-text-light text-sm px-4 py-2 rounded shadow-md transition-colors"
              onClick={refetch}
            >
              Retry Incantation
            </button>
          </div>
        ) : Object.keys(filteredSections).length === 0 ? (
          <div className="w-full py-8 text-center text-base text-ancient-text-muted">
            No ancient entities found matching your query.
          </div>
        ) : (
          Object.keys(filteredSections)
            .sort()
            .map((letter) => (
              <div key={letter}>
                <div className="px-6 py-3 text-sm font-semibold text-ancient-icon-glow border-b border-ancient-border-stone/50">
                  {letter}
                </div>
                <ul>
                  {filteredSections[letter].map((u) => (
                    <li key={u.id || u.email}>
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
