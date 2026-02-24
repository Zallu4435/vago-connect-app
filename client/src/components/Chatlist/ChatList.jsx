"use client";
import React, { useState, useEffect } from "react";
import List from "./List";
import SearchBar from "./SearchBar";
import ChatListHeader from "./ChatListHeader";
import ContactsList from "./ContactsList";
import { useChatStore } from "@/stores/chatStore";

function ChatList() {
  const allContactsPage = useChatStore((s) => s.allContactsPage);
  const [pageType, setPageType] = useState("default");

  useEffect(() => {
    setPageType(allContactsPage ? "contacts" : "default");
  }, [allContactsPage]);

  return (
    <div className="
      bg-ancient-bg-dark flex flex-col
      h-full max-h-full w-full
      md:w-[320px] lg:w-[400px]
      overflow-hidden border-r border-ancient-border-stone z-20 shadow-xl
      transition-all
    ">
      {/* Default chats view */}
      <div className={`${pageType === 'default' ? 'block' : 'hidden'} contents`}>
        <ChatListHeader />
        <SearchBar />
        {/* Main scrollable area for chat list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          <List pageType={pageType} />
        </div>
      </div>

      {/* Contacts view */}
      <div className={`${pageType === 'contacts' ? 'block' : 'hidden'} h-full`}>
        <ContactsList />
      </div>
    </div>
  );
}

export default ChatList;
