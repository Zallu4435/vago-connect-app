import React, { useEffect, useState, useRef } from "react";
import { BiSearchAlt2 } from "react-icons/bi";
import { BsFilter } from "react-icons/bs";
import { IoClose } from "react-icons/io5";
import { useChatStore } from "@/stores/chatStore";

function SearchBar() {
  const contactsSearch = useChatStore((s) => s.contactsSearch);
  const setContactsSearch = useChatStore((s) => s.setContactsSearch);
  const [localValue, setLocalValue] = useState(contactsSearch || "");
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(contactsSearch || "");
  }, [contactsSearch]);

  useEffect(() => {
    const id = setTimeout(() => setContactsSearch(localValue), 300);
    return () => clearTimeout(id);
  }, [localValue, setContactsSearch]);

  return (
    <div className="bg-ancient-bg-medium flex items-center gap-2 h-14 px-5 border-b border-ancient-border-stone shadow-lg">
      <div className="relative flex-grow h-10 flex items-center bg-ancient-input-bg border border-ancient-input-border rounded-full px-4 shadow-inner focus-within:border-ancient-icon-glow transition-all duration-300">
        {/* Search Icon, left inside input */}
        <BiSearchAlt2 className="text-ancient-icon-inactive text-xl mr-3 transition-colors duration-300" />
        <input
          type="text"
          placeholder="Search for whispers or ancient echoes..."
          className="bg-transparent flex-1 text-ancient-text-light placeholder:text-ancient-text-muted text-base focus:outline-none h-full"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          spellCheck={false}
          ref={inputRef}
        />
        {localValue ? (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute right-2 w-7 h-7 flex items-center justify-center rounded-full hover:bg-ancient-bg-dark/40 transition-colors"
            onClick={() => { setLocalValue(""); setTimeout(() => inputRef.current?.focus(), 0); }}
          >
            <IoClose className="text-ancient-icon-inactive text-lg" />
          </button>
        ) : null}
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
