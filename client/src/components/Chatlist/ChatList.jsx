"use client";
import React, { useState, useEffect } from "react";
import List from "./List"; // This component will need its own thematic update
import SearchBar from "./SearchBar"; // This component will need its own thematic update
import ChatListHeader from "./ChatListHeader"; // This component will need its own thematic update
import ContactsList from "./ContactsList"; // This component will need its own thematic update
import { useChatStore } from "@/stores/chatStore";

function ChatList() {
  const allContactsPage = useChatStore((s) => s.allContactsPage);
  const [pageType, setPageType] = useState("default"); // "default" for chat list, "contacts" for contacts list

  // Sync pageType with allContactsPage from store
  useEffect(() => {
    if (allContactsPage) {
      setPageType("contacts");
    } else {
      setPageType("default");
    }
  }, [allContactsPage]);

  return (
    <div
      className="bg-ancient-bg-dark flex flex-col h-screen max-h-screen w-full lg:w-[400px] overflow-hidden border-r border-ancient-border-stone z-20 shadow-xl"
      // Added max-width for large screens for better sidebar appearance, similar to Telegram/WhatsApp
    >
      {/* Conditionally render based on pageType */}
      {pageType === "default" && (
        <>
          {/* Header for the chat list, needs thematic update */}
          <ChatListHeader />
          {/* Search bar for chats, needs thematic update */}
          <SearchBar />

          {/* Main scrollable area for chat list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* The List component itself will render the chat previews and will need thematic adjustments */}
            <List pageType={pageType} />
            {/* Optional: Add a themed empty state if no chats in the List component */}
            {/* <div className="text-ancient-text-muted text-center p-4">No active ancient whispers.</div> */}
          </div>
        </>
      )}

      {pageType === "contacts" && (
        // The ContactsList component will handle its own header and search, and needs thematic adjustments
        <ContactsList />
      )}
    </div>
  );
}

export default ChatList;