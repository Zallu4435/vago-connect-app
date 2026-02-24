import React, { useState } from "react";
import ChatHeader from "./ChatHeader";
import ChatContainer from "./ChatContainer";
import MessageBar from "./MessageBar";
import { useChatStore } from "@/stores/chatStore";
import MediaGallery from "./MediaGallery";
import IncomingCallNotification from "@/components/common/IncomingCallNotification";

function Chat({ isOnline }) {
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const messages = useChatStore((s) => s.messages);
  const [showMedia, setShowMedia] = useState(false);

  if (!currentChatUser) return null;

  return (
    <div className="
      flex flex-col
      h-full max-h-full
      w-full max-w-none
      bg-conversation-panel-background
      relative
      overflow-hidden
      transition-all
    ">
      {/* Header fixed on top on mobile for better navigation */}
      <div className="flex-shrink-0 sticky top-0 z-30">
        <ChatHeader onOpenMedia={() => setShowMedia(true)} />
      </div>

      {/* Scrollable, grows with available space (ChatContainer handles scrolling) */}
      <div className="flex-1 min-h-0 relative overflow-hidden bg-transparent">
        <ChatContainer key={`chat-${currentChatUser.id}-${messages.length}`} />
      </div>

      {/* Message bar sticks to bottom, never overflows */}
      <div className="flex-shrink-0 sticky bottom-0 z-20 bg-gradient-to-t from-[#1a1c20]/90 via-transparent to-transparent">
        <MessageBar isOnline={isOnline} />
      </div>

      {/* Media gallery modal */}
      <MediaGallery open={showMedia} onClose={() => setShowMedia(false)} />

      {/* Call notification, always overlays */}
      <div className="fixed inset-x-0 bottom-0 pointer-events-none z-40">
        <IncomingCallNotification />
      </div>
    </div>
  );
}

export default Chat;
