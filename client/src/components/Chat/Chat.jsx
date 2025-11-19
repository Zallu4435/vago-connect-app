import React from "react";
import ChatHeader from "./ChatHeader";
import ChatContainer from "./ChatContainer";
import MessageBar from "./MessageBar";
import { useChatStore } from "@/stores/chatStore";

function Chat({ isOnline }) {
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const messages = useChatStore((s) => s.messages);

  if (!currentChatUser) return null;

  return (
    <div className="flex flex-col h-full bg-conversation-panel-background">
      <ChatHeader />
      <ChatContainer key={`chat-${currentChatUser.id}-${messages.length}`} />
      <MessageBar isOnline={isOnline} />
    </div>
  );
}

export default Chat;
