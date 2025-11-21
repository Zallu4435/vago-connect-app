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

  useEffect(() => { setLocalValue(contactsSearch || ""); }, [contactsSearch]);
  useEffect(() => {
    const id = setTimeout(() => setContactsSearch(localValue), 300);
    return () => clearTimeout(id);
  }, [localValue, setContactsSearch]);

  return (
    <div className="
      bg-ancient-bg-medium flex items-center gap-2
      h-12 sm:h-14 px-2 sm:px-5 border-b border-ancient-border-stone shadow-lg
    ">
      <div className="
        relative flex-grow h-9 sm:h-10 flex items-center
        bg-ancient-input-bg border border-ancient-input-border
        rounded-full px-3 sm:px-4
        shadow-inner focus-within:border-ancient-icon-glow
        transition-all duration-300
      ">
        <BiSearchAlt2 className="text-ancient-icon-inactive text-lg sm:text-xl mr-2 sm:mr-3 transition-colors duration-300" />
        <input
          type="text"
          placeholder="Search chats or contacts..."
          className="
            bg-transparent flex-1 text-ancient-text-light placeholder:text-ancient-text-muted
            text-sm sm:text-base focus:outline-none h-full
          "
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          spellCheck={false}
          ref={inputRef}
        />
        {localValue ? (
          <button
            type="button"
            aria-label="Clear search"
            className="
              absolute right-2 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center
              rounded-full hover:bg-ancient-bg-dark/40 transition-colors
            "
            onClick={() => { setLocalValue(""); setTimeout(() => inputRef.current?.focus(), 0); }}
          >
            <IoClose className="text-ancient-icon-inactive text-base sm:text-lg" />
          </button>
        ) : null}
      </div>
      <button
        type="button"
        className="
          flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full
          hover:bg-ancient-input-bg transition-colors duration-300
          border border-ancient-input-border shadow
        "
        aria-label="Filter"
      >
        <BsFilter className="text-ancient-icon-inactive text-xl sm:text-2xl hover:text-ancient-icon-glow transition-colors duration-300" />
      </button>
    </div>
  );
}

export default SearchBar;
