import React from "react";
import { HiChatBubbleLeftRight } from "react-icons/hi2";

function Empty() {
  return (
    <div className="border-ancient-border-stone border-b-4 border-b-ancient-icon-glow w-full bg-ancient-bg-dark flex flex-col h-[100vh] items-center justify-center shadow-inner">
      <HiChatBubbleLeftRight className="text-[300px] text-ancient-icon-glow animate-pulse-slow" /> {/* Themed icon with subtle animation */}
      <p className="text-ancient-text-light mt-8 text-2xl select-none font-semibold tracking-wider">
        Awaiting Ancient Correspondence
      </p>
      <p className="text-ancient-text-muted mt-2 text-base select-none">
        Select an entity to begin your whispers.
      </p>
    </div>
  );
}

export default Empty;