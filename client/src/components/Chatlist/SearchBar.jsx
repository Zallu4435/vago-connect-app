import React from "react";
import { BiSearchAlt2 } from "react-icons/bi";
import { BsFilter } from "react-icons/bs";
import { useChatStore } from "@/stores/chatStore";

function SearchBar() {
  const contactsSearch = useChatStore((s) => s.contactsSearch);
  const setContactsSearch = useChatStore((s) => s.setContactsSearch);

  return (
    <div className="bg-ancient-bg-medium flex items-center gap-2 h-14 px-5 border-b border-ancient-border-stone shadow-lg">
      <div className="flex-grow h-10 flex items-center bg-ancient-input-bg border border-ancient-input-border rounded-full px-4 shadow-inner focus-within:border-ancient-icon-glow transition-all duration-300">
        {/* Search Icon, left inside input */}
        <BiSearchAlt2 className="text-ancient-icon-inactive text-xl mr-3 transition-colors duration-300" />
        <input
          type="text"
          placeholder="Search for whispers or ancient echoes..."
          className="bg-transparent flex-1 text-ancient-text-light placeholder:text-ancient-text-muted text-base focus:outline-none h-full"
          value={contactsSearch}
          onChange={(e) => setContactsSearch(e.target.value)}
          spellCheck={false}
        />
      </div>
      {/* Filter Button, right side, circular, subtle border/shadow */}
      <button
        type="button"
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-ancient-input-bg transition-colors duration-300 border border-ancient-input-border shadow"
        aria-label="Filter"
      >
        <BsFilter className="text-ancient-icon-inactive text-2xl hover:text-ancient-icon-glow transition-colors duration-300" />
      </button>
    </div>
  );
}

export default SearchBar;
