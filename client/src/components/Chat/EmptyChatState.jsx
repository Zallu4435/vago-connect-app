"use client";
import React from "react";
import { MdArrowDownward } from "react-icons/md";

function EmptyChatState({ currentChatUser }) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-ancient-bg-dark flex items-center justify-center mb-4">
                <MdArrowDownward className="text-ancient-text-muted text-2xl rotate-[135deg]" />
            </div>
            <h3 className="text-ancient-text-light text-lg font-medium mb-1">No messages yet</h3>
            <p className="text-ancient-text-muted text-sm max-w-xs">
                Send a message to start the conversation with {currentChatUser?.name}
            </p>
        </div>
    );
}

export default EmptyChatState;
