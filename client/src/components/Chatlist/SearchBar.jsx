import React from "react";
import { BiSearchAlt2 } from "react-icons/bi";
import { BsFilter } from "react-icons/bs";
import { useChatStore } from "@/stores/chatStore";

function SearchBar() {
  const contactsSearch = useChatStore((s) => s.contactsSearch);
  const setContactsSearch = useChatStore((s) => s.setContactsSearch);

  return (
    <div className="bg-search-input-container-background flex py-3 pl-5 items-center gap-3 h-14 border-b border-conversation-border">
      <div className="bg-panel-header-background flex items-center gap-5 px-3 py-1 rounded-lg flex-grow">
        <div>
          <BiSearchAlt2 className="text-panel-header-icon cursor-pointer text-lg" />
        </div>
        <div>
          <input
            type="text"
            placeholder="Search or start a new chat"
            className="bg-transparent text-sm focus:outline-none text-white placeholder:text-secondary w-full"
            value={contactsSearch}
            onChange={(e) => setContactsSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="pr-5 pl-3">
        <BsFilter className="text-panel-header-icon cursor-pointer text-lg" />
      </div>
    </div>
  );
}

export default SearchBar;