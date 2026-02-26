import React, { useState } from "react";
import ChatHeader from "./ChatHeader";
import ChatContainer from "./ChatContainer";
import MessageBar from "./MessageBar";
import dynamic from "next/dynamic";
import { useChatStore } from "@/stores/chatStore";

const MediaGallery = dynamic(() => import("./MediaGallery"), { ssr: false });
const GroupManageModal = dynamic(() => import("./GroupManageModal"), { ssr: false });

function Chat({ isOnline }) {
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const messages = useChatStore((s) => s.messages);
  const [showMedia, setShowMedia] = useState(false);
  const [showGroupManage, setShowGroupManage] = useState(false);

  React.useEffect(() => {
    setShowMedia(false);
    setShowGroupManage(false);
  }, [currentChatUser?.id]);

  if (!currentChatUser) return null;

  return (
    <div className="flex h-full w-full bg-conversation-panel-background overflow-hidden relative transition-all">
      {/* Main Chat Column */}
      <div className={`
        flex-1 min-w-0 flex flex-col h-full relative transition-all duration-300
        ${showGroupManage ? 'hidden lg:flex' : 'flex'}
      `}>
        {/* Header fixed on top on mobile for better navigation */}
        <div className="flex-shrink-0 sticky top-0 z-30">
          <ChatHeader
            onOpenMedia={() => setShowMedia(true)}
            onOpenGroupManage={() => setShowGroupManage(true)}
          />
        </div>

        {/* Scrollable, grows with available space (ChatContainer handles scrolling) */}
        <div className="flex-1 min-h-0 relative overflow-hidden bg-transparent">
          <ChatContainer key={`chat-${String(currentChatUser.id)}`} />
        </div>

        {/* Message bar sticks to bottom, never overflows */}
        <div className="flex-shrink-0 sticky bottom-0 z-20 bg-gradient-to-t from-[#1a1c20]/90 via-transparent to-transparent">
          <MessageBar isOnline={isOnline} />
        </div>

        {/* Media gallery modal */}
        <MediaGallery open={showMedia} onClose={() => setShowMedia(false)} />

      </div>

      {/* Right Sidebar: Group Management — always mounted so AnimatedPanel can play exit animation */}
      <div className={`
        ${showGroupManage ? 'w-full lg:w-[400px] xl:w-[450px]' : 'w-0'}
        flex-shrink-0 h-full border-l border-ancient-border-stone bg-ancient-bg-dark z-40 relative
        overflow-hidden transition-all duration-300
      `}>
        <GroupManageModal
          open={showGroupManage}
          onClose={() => setShowGroupManage(false)}
          groupId={currentChatUser.id}
        />
      </div>

    </div>
  );
}

export default Chat;
