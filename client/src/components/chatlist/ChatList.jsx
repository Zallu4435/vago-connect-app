"use client";
import React, { useEffect, useRef, useState } from "react";
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

const PANEL_COMPONENTS = {
  contacts: ContactsList,
  profile: ProfileView,
  calls: CallsList,
};

const ANIM_DURATION = 300;

function ChatList() {
  const activePage = useChatStore((s) => s.activePage);

  // Track the "slot" — what component is currently in the overlay slot
  // and whether it should be open (for enter) or closing (for exit)
  const [slot, setSlot] = useState(null); // { page, open }
  const exitTimer = useRef(null);

  useEffect(() => {
    clearTimeout(exitTimer.current);

    if (activePage !== "default") {
      // Opening a panel: set the slot immediately with open=true
      setSlot({ page: activePage, open: true });
    } else {
      // Returning to default: trigger exit on whatever is in the slot
      setSlot((prev) => (prev ? { ...prev, open: false } : null));
      // After animation, clear the slot
      exitTimer.current = setTimeout(() => setSlot(null), ANIM_DURATION);
    }
    return () => clearTimeout(exitTimer.current);
  }, [activePage]);

  const PanelComponent = slot ? PANEL_COMPONENTS[slot.page] : null;

  return (
    <div className="
      bg-ancient-bg-dark flex flex-col
      h-full max-h-full w-full
      md:w-[320px] lg:w-[400px]
      overflow-hidden border-r border-ancient-border-stone z-20 shadow-xl
      relative
    ">
      {/* Default chats view — always visible underneath */}
      <div className="flex flex-col h-full overflow-hidden">
        <ChatListHeader />
        <SearchBar />
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          <List pageType="default" />
        </div>
      </div>

      {/* Single overlay slot — only mounts the relevant panel */}
      {PanelComponent && (
        <div className="absolute inset-0 z-10">
          <PanelComponent open={slot.open} />
        </div>
      )}
    </div>
  );
}

export default ChatList;
