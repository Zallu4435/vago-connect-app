import React from "react";
import { BiSearchAlt2 } from "react-icons/bi";
import { BsFilter } from "react-icons/bs";
import { useChatStore } from "@/stores/chatStore";

function SearchBar() {
  const contactsSearch = useChatStore((s) => s.contactsSearch);
  const setContactsSearch = useChatStore((s) => s.setContactsSearch);

  return (
    <div className="bg-bg-secondary flex items-center gap-3 h-14 px-4 border-b border-conversation-border">
      <div className="bg-bg-main flex items-center gap-3 px-4 py-2 rounded-lg flex-grow shadow-sm border border-border-dark focus-within:border-icon-active transition-all">
        <BiSearchAlt2 className="text-icon-active text-xl" />
        <input
          type="text"
          placeholder="Search or start a new chat"
          className="bg-transparent w-full text-text-primary placeholder:text-text-secondary text-sm focus:outline-none"
          value={contactsSearch}
          onChange={(e) => setContactsSearch(e.target.value)}
          spellCheck={false}
        />
      </div>
      <button
        type="button"
        className="flex items-center justify-center p-2 rounded-lg hover:bg-bg-hover transition-colors"
        aria-label="Filter"
      >
        <BsFilter className="text-icon-active text-xl" />
      </button>
    </div>
  );
}

export default SearchBar;
