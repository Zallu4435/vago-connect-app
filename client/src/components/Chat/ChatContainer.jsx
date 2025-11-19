"use client";
import { useStateProvider } from "@/context/StateContext";
import { calculateTime } from "@/utils/CalculateTime";
import React from "react";
import MessageStatus from "../common/MessageStatus";
import dynamic from "next/dynamic";

const VoiceMessage = dynamic(() => import("../Chat/VoiceMessage"))

function ChatContainer() {
  const [{messages, currentChatUser, userInfo}] = useStateProvider();

  return (
     <div className="h-[80vh] w-full relative flex-grow overflow-auto custom-scrollbar">
      <div className="bg-chat-background bg-fixed h-full w-full opacity-5 fixed left-0 top-0 z-0 pointer-events-none"></div>

      <div className="flex w-full">
        <div className="flex flex-col justify-end w-full gap-1 overflow-auto">
          {(Array.isArray(messages) ? messages : []).map((message) => {
            const isIncoming = message.senderId === currentChatUser?.id;
            return (
              <div key={message.id} className={`flex ${isIncoming ? 'justify-start' : 'justify-end'}`}>
                {message.type === "text" && (
                  <div className={`text-white px-2 py-[5px] text-sm rounded-md flex gap-2 items-end max-w-[45%] ${isIncoming ? 'bg-incoming-background' : 'bg-outgoing-background'}`}>
                    <span className="break-all">{message.content}</span>
                    <div className="flex gap-1 items-end">
                      <span className="text-bubble-meta text-[11px] pt-1 min-w-fit">
                        {calculateTime(message.timestamp)}
                      </span>
                      <span>
                        {message.senderId === userInfo.id && (
                          <MessageStatus MessageStatus={message.messageStatus} />
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {message.type === "image" && (
                  <div className={`text-white p-1 rounded-md flex gap-2 items-end max-w-[60%] ${isIncoming ? 'bg-incoming-background' : 'bg-outgoing-background'}`}>
                    <img
                      src={message.content}
                      alt="image message"
                      className="rounded-md max-w-[320px] max-h-72 object-cover"
                    />
                    <div className="flex gap-1 items-end">
                      <span className="text-bubble-meta text-[11px] pt-1 min-w-fit">
                        {calculateTime(message.timestamp)}
                      </span>
                      <span>
                        {message.senderId === userInfo.id && (
                          <MessageStatus MessageStatus={message.messageStatus} />
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {message.type === "audio" && (
                  <div className="max-w-[60%]">
                    <VoiceMessage message={message} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
     </div>
  );
}

export default ChatContainer;
