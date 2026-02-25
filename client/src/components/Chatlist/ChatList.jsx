"use client";
import React, { useState, useEffect } from "react";
import List from "./List";
import SearchBar from "./SearchBar";
import ChatListHeader from "./ChatListHeader";
import dynamic from "next/dynamic";
import { useChatStore } from "@/stores/chatStore";

const ContactsList = dynamic(() => import("./ContactsList"), {
  loading: () => <div className="h-full bg-ancient-bg-dark" />,
});
const ProfileView = dynamic(() => import("./ProfileView"), {
  loading: () => <div className="h-full bg-ancient-bg-dark" />,
});
const CallsList = dynamic(() => import("./CallsList"), {
  loading: () => <div className="h-full bg-ancient-bg-dark" />,
});

function ChatList() {
  const activePage = useChatStore((s) => s.activePage);

  return (
    <div className="
      bg-ancient-bg-dark flex flex-col
      h-full max-h-full w-full
      md:w-[320px] lg:w-[400px]
      overflow-hidden border-r border-ancient-border-stone z-20 shadow-xl
      transition-all
    ">
      {/* Default chats view */}
      {activePage === 'default' && (
        <div className="flex flex-col h-full overflow-hidden">
          <ChatListHeader />
          <SearchBar />
          {/* Main scrollable area for chat list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            <List pageType={activePage} />
          </div>
        </div>
      )}

      {/* Contacts view */}
      {activePage === 'contacts' && (
        <div className="h-full">
          <ContactsList />
        </div>
      )}

      {/* Profile view */}
      {activePage === 'profile' && (
        <div className="h-full">
          <ProfileView />
        </div>
      )}

      {/* Calls view */}
      {activePage === 'calls' && (
        <div className="h-full animate-slide-in">
          <CallsList />
        </div>
      )}
    </div>
  );
}

export default ChatList;
