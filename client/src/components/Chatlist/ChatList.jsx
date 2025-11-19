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
    if(allContactsPage) {
      setPageType("contacts");
    } else {
      setPageType("default");
    }
  }, [allContactsPage])

  return (
    <div className="bg-search-input-container-background flex flex-col h-screen max-h-screen w-full overflow-hidden border-r border-conversation-border z-20">
      { pageType === "default" && (
        <>
          <ChatListHeader />
          <SearchBar />
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <List pageType={pageType} />
          </div>
        </>
      )}
      { pageType === "contacts" && (
        <ContactsList />
      )}
    </div>
  );
}

export default ChatList;
