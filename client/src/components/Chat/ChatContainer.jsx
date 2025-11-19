"use client";
import { calculateTime } from "@/utils/CalculateTime";
import React, { useState } from "react";
import MessageStatus from "../common/MessageStatus";
import dynamic from "next/dynamic";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import MessageActions from "./MessageActions";
import { FaStar } from "react-icons/fa";
import ForwardModal from "./ForwardModal";
import { showToast } from "@/lib/toast";

const VoiceMessage = dynamic(() => import("../Chat/VoiceMessage"));

function ChatContainer() {
  const messages = useChatStore((s) => s.messages);
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const userInfo = useAuthStore((s) => s.userInfo);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showForward, setShowForward] = useState(false);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) {
        showToast.info("You can forward up to 5 messages at once");
        return prev;
      }
      return [...prev, id];
    });
  };

  return (
    <div className="h-[80vh] w-full relative flex-grow overflow-auto custom-scrollbar bg-bg-main text-text-primary">
      <div className="bg-chat-background bg-fixed h-full w-full opacity-5 fixed left-0 top-0 z-0 pointer-events-none rounded-lg"></div>

      <div className="flex w-full">
        <div className="flex flex-col justify-end w-full gap-1 overflow-auto px-3">
          {(Array.isArray(messages) ? messages : [])
            .filter((m) => !(Array.isArray(m?.deletedBy) && m.deletedBy.includes(userInfo?.id)))
            .map((message) => {
              const isIncoming = message.senderId === currentChatUser?.id;
              return (
                <div key={message.id} className={`flex ${isIncoming ? "justify-start" : "justify-end"}`}>
                  {/* Selection checkbox when selectMode is on */}
                  {selectMode && (
                    <input
                      type="checkbox"
                      className="mr-2 mt-1"
                      checked={selectedIds.includes(message.id)}
                      onChange={() => toggleSelect(message.id)}
                    />
                  )}

                  {/* Text message */}
                  {message.type === "text" && (
                    <div className="flex flex-col max-w-[60%] gap-1">
                      {message.isForwarded && (
                        <span className="self-start text-[10px] text-text-secondary">Forwarded</span>
                      )}
                      <div
                        className={`text-text-primary px-3 py-[5px] text-sm rounded-md flex gap-2 items-end ${isIncoming ? "bg-incoming-background" : "bg-outgoing-background"}`}
                      >
                        <span className="break-all">{message.content}</span>
                        <div className="flex gap-1 items-end">
                          <span className="text-bubble-meta text-[11px] pt-1 min-w-fit">
                            {calculateTime(message.timestamp)}
                          </span>
                          {message.isEdited && (
                            <span className="text-bubble-meta text-[10px] ml-1">(edited)</span>
                          )}
                          {Array.isArray(message.starredBy) &&
                            message.starredBy.some((e) => (e?.userId ?? e) === userInfo.id) && (
                              <FaStar className="text-yellow-400 text-[10px] mb-[2px]" />
                            )}
                          <span>
                            {message.senderId === userInfo.id && (
                              <MessageStatus MessageStatus={message.messageStatus} />
                            )}
                          </span>
                        </div>
                      </div>
                      {/* Reactions summary */}
                      {Array.isArray(message.reactions) && message.reactions.length > 0 && (
                        <div className="flex gap-2 text-xs text-white/80">
                          {Object.entries(
                            message.reactions.reduce((acc, r) => {
                              const key = r.emoji || r;
                              acc[key] = (acc[key] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([emoji, count]) => (
                            <span
                              key={emoji}
                              className="px-2 py-[2px] rounded-full bg-[#1f2c33] border border-[#2a3942]"
                            >
                              {emoji} {count}
                            </span>
                          ))}
                        </div>
                      )}
                      <MessageActions message={message} />
                    </div>
                  )}

                  {/* Image message */}
                  {message.type === "image" && (
                    <div className="flex flex-col max-w-[60%] gap-1">
                      {message.isForwarded && (
                        <span className="self-start text-[10px] text-text-secondary">Forwarded</span>
                      )}
                      <div
                        className={`text-text-primary p-1 rounded-md flex gap-2 items-end ${isIncoming ? "bg-incoming-background" : "bg-outgoing-background"}`}
                      >
                        <img
                          src={message.content}
                          alt="image message"
                          className="rounded-md max-w-[320px] max-h-72 object-cover"
                        />
                        <div className="flex gap-1 items-end">
                          <span className="text-bubble-meta text-[11px] pt-1 min-w-fit">
                            {calculateTime(message.timestamp)}
                          </span>
                          {message.isEdited && (
                            <span className="text-bubble-meta text-[10px] ml-1">(edited)</span>
                          )}
                          {Array.isArray(message.starredBy) &&
                            message.starredBy.some((e) => (e?.userId ?? e) === userInfo.id) && (
                              <FaStar className="text-yellow-400 text-[10px] mb-[2px]" />
                            )}
                          <span>
                            {message.senderId === userInfo.id && (
                              <MessageStatus MessageStatus={message.messageStatus} />
                            )}
                          </span>
                        </div>
                      </div>
                      {/* Reactions summary */}
                      {Array.isArray(message.reactions) && message.reactions.length > 0 && (
                        <div className="flex gap-2 text-xs text-white/80">
                          {Object.entries(
                            message.reactions.reduce((acc, r) => {
                              const key = r.emoji || r;
                              acc[key] = (acc[key] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([emoji, count]) => (
                            <span
                              key={emoji}
                              className="px-2 py-[2px] rounded-full bg-[#1f2c33] border border-[#2a3942]"
                            >
                              {emoji} {count}
                            </span>
                          ))}
                        </div>
                      )}
                      <MessageActions message={message} />
                    </div>
                  )}

                  {/* Audio message */}
                  {message.type === "audio" && (
                    <div className="flex flex-col max-w-[60%] gap-1">
                      {message.isForwarded && (
                        <span className="self-start text-[10px] text-text-secondary">Forwarded</span>
                      )}
                      <VoiceMessage message={message} />
                      {Array.isArray(message.reactions) && message.reactions.length > 0 && (
                        <div className="flex gap-2 text-xs text-white/80">
                          {Object.entries(
                            message.reactions.reduce((acc, r) => {
                              const key = r.emoji || r;
                              acc[key] = (acc[key] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([emoji, count]) => (
                            <span
                              key={emoji}
                              className="px-2 py-[2px] rounded-full bg-[#1f2c33] border border-[#2a3942]"
                            >
                              {emoji} {count}
                            </span>
                          ))}
                        </div>
                      )}
                      <MessageActions message={message} />
                    </div>
                  )}
                </div>
              );
            })}
          {/* Selection bar */}
          <div className="sticky bottom-2 self-center mt-2">
            <div className="flex items-center gap-2 bg-bg-secondary border border-conversation-border rounded-full px-3 py-1">
              <button
                className="text-sm text-text-primary/90 hover:underline"
                onClick={() => setSelectMode((v) => !v)}
              >
                {selectMode ? "Cancel" : "Select"}
              </button>
              {selectMode && (
                <>
                  <span className="text-bubble-meta text-xs">{selectedIds.length} selected</span>
                  <button
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1 rounded disabled:opacity-50"
                    disabled={selectedIds.length === 0}
                    onClick={() => setShowForward(true)}
                  >
                    Forward
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <ForwardModal
        open={showForward}
        onClose={() => {
          setShowForward(false);
          setSelectedIds([]);
          setSelectMode(false);
        }}
        fromUserId={userInfo?.id}
        initialMessageIds={selectedIds}
      />
    </div>
  );
}

export default ChatContainer;
