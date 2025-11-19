import React from "react";
import { HiChatBubbleLeftRight } from "react-icons/hi2";

function Empty() {
  return (
    <div className="border-conversation-border border-b-4 border-b-icon-green w-full bg-bg-secondary flex flex-col h-[100vh] items-center justify-center">
      <HiChatBubbleLeftRight className="text-[300px] text-icon-active" />
      <p className="text-text-primary mt-6 text-xl select-none">No chat selected</p>
    </div>
  );
}

export default Empty;
