import React from "react";
import ChatHeader from "./ChatHeader";
import ChatContainer from "./ChatContainer";
import MessageBar from "./MessageBar";
import { useChatStore } from "@/stores/chatStore";
import { useState } from "react";
import MediaGallery from "./MediaGallery";

function Chat({ isOnline }) {
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const messages = useChatStore((s) => s.messages);
  const [showMedia, setShowMedia] = useState(false);

  if (!currentChatUser) return null;

  return (
    <div className="flex flex-col h-full bg-conversation-panel-background">
      <ChatHeader onOpenMedia={() => setShowMedia(true)} />
      <ChatContainer key={`chat-${currentChatUser.id}-${messages.length}`} />
      <MessageBar isOnline={isOnline} />
      <MediaGallery open={showMedia} onClose={() => setShowMedia(false)} />
    </div>
  );
}

export default Chat;
