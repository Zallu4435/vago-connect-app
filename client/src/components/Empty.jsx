import React from "react";
import { HiChatBubbleLeftRight } from "react-icons/hi2";

function Empty() {
  return (
    <div className="
      border-ancient-border-stone border-b-4 border-b-ancient-icon-glow
      w-full bg-ancient-bg-dark flex flex-col
      min-h-[80vh] sm:min-h-[100vh] items-center justify-center
      shadow-inner p-4 sm:p-8
    ">
      <HiChatBubbleLeftRight className="
        text-[150px] sm:text-[300px]
        text-ancient-icon-glow animate-pulse-slow
        select-none
      " />
      <p className="
        text-ancient-text-light mt-6 sm:mt-8 text-xl sm:text-2xl
        select-none font-semibold tracking-wider text-center max-w-md
      ">
        No chat selected
      </p>
      <p className="
        text-ancient-text-muted mt-1 sm:mt-2 text-sm sm:text-base
        select-none text-center max-w-sm
      ">
        Choose a conversation from the list to start chatting.
      </p>
    </div>
  );
}

export default Empty;
