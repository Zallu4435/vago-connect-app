"use client";
import { calculateTime } from "@/utils/CalculateTime";
import React, { useState } from "react";
import MessageStatus from "../common/MessageStatus";
import dynamic from "next/dynamic";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import MessageActions from "./MessageActions"; // This component will also need thematic updates
import { FaStar } from "react-icons/fa";
import ForwardModal from "./ForwardModal"; // This component will also need thematic updates
import { showToast } from "@/lib/toast";

const VoiceMessage = dynamic(() => import("../Chat/VoiceMessage")); // This component will need thematic updates

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
        showToast.info("You can forward up to 5 echoes at once"); // Themed toast
        return prev;
      }
      return [...prev, id];
    });
  };

  return (
    <div className="h-[80vh] w-full relative flex-grow overflow-auto custom-scrollbar bg-ancient-bg-dark text-ancient-text-light">
      {/* Background Image/Pattern - Adjust opacity and blend mode as needed for your image */}
      <div className="bg-chat-background bg-fixed h-full w-full opacity-[0.05] fixed left-0 top-0 z-0 pointer-events-none rounded-lg"></div>

      <div className="flex w-full">
        <div className="flex flex-col justify-end w-full gap-2 overflow-auto px-4 py-2">
          {" "}
          {/* Increased gap and padding */}
          {(Array.isArray(messages) ? messages : [])
            .filter((m) => !(Array.isArray(m?.deletedBy) && m.deletedBy.includes(userInfo?.id)))
            .map((message) => {
              const isIncoming = message.senderId === currentChatUser?.id;
              const messageBubbleClass = isIncoming
                ? "bg-ancient-bubble-user rounded-br-lg rounded-tl-lg rounded-tr-lg" // Incoming bubble
                : "bg-ancient-bubble-other rounded-bl-lg rounded-tl-lg rounded-tr-lg"; // Outgoing bubble (reversed the colors from default for the theme)

              return (
                <div key={message.id} className={`flex ${isIncoming ? "justify-start" : "justify-end"}`}>
                  {/* Selection checkbox when selectMode is on */}
                  {selectMode && (
                    <input
                      type="checkbox"
                      className="mr-3 mt-1 form-checkbox h-5 w-5 text-ancient-icon-glow border-ancient-border-stone rounded focus:ring-0 cursor-pointer" // Themed checkbox
                      checked={selectedIds.includes(message.id)}
                      onChange={() => toggleSelect(message.id)}
                    />
                  )}

                  {/* Text message */}
                  {message.type === "text" && (
                    <div className="flex flex-col max-w-[65%] gap-1">
                      {" "}
                      {/* Increased max-width */}
                      {message.isForwarded && (
                        <span className="self-start text-[10px] text-ancient-text-muted italic">
                          Forwarded Echo
                        </span> // Themed
                      )}
                      <div className={`px-4 py-2 text-base shadow-md ${messageBubbleClass} text-ancient-text-light flex gap-2 items-end relative`}>
                        <span className="break-all">{message.content}</span>
                        <div className="flex gap-1 items-end ml-auto">
                          {" "}
                          {/* Push time/status to right */}
                          <span className="text-ancient-text-muted text-[11px] pt-1 min-w-fit">
                            {calculateTime(message.timestamp)}
                          </span>
                          {message.isEdited && (
                            <span className="text-ancient-text-muted text-[10px] ml-1">
                              (altered)
                            </span>
                          )}{" "}
                          {/* Themed */}
                          {Array.isArray(message.starredBy) &&
                            message.starredBy.some((e) => (e?.userId ?? e) === userInfo.id) && (
                              <FaStar className="text-ancient-icon-glow text-[10px] mb-[2px] shadow-sm" />
                            )}{" "}
                          {/* Themed star */}
                          <span>
                            {message.senderId === userInfo.id && (
                              <MessageStatus MessageStatus={message.messageStatus} />
                            )}{" "}
                            {/* MessageStatus component needs theme updates */}
                          </span>
                        </div>
                        <MessageActions message={message} />{" "}
                        {/* This component will need thematic updates */}
                      </div>
                      {/* Reactions summary */}
                      {Array.isArray(message.reactions) && message.reactions.length > 0 && (
                        <div className="flex gap-2 text-xs text-ancient-text-light/80 mt-1">
                          {Object.entries(
                            message.reactions.reduce((acc, r) => {
                              const key = r.emoji || r;
                              acc[key] = (acc[key] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([emoji, count]) => (
                            <span
                              key={emoji}
                              className="px-2 py-[2px] rounded-full bg-ancient-input-bg border border-ancient-border-stone shadow-sm" // Themed reactions
                            >
                              {emoji} {count}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Image message */}
                  {message.type === "image" && (
                    <div className="flex flex-col max-w-[65%] gap-1">
                      {message.isForwarded && (
                        <span className="self-start text-[10px] text-ancient-text-muted italic">
                          Forwarded Echo
                        </span>
                      )}
                      <div
                        className={`p-2 rounded-md shadow-md ${messageBubbleClass} flex gap-2 items-end relative`}
                      >
                        <img
                          src={message.content}
                          alt="ancient image echo" // Themed alt text
                          className="rounded-lg max-w-[350px] max-h-80 object-cover border border-ancient-border-stone" // Themed image border
                        />
                        <div className="flex gap-1 items-end absolute bottom-2 right-2">
                          {" "}
                          {/* Positioning time/status on image */}
                          <span className="text-ancient-text-muted text-[11px] pt-1 min-w-fit bg-ancient-bg-dark/70 px-1 rounded">
                            {calculateTime(message.timestamp)}
                          </span>
                          {message.isEdited && (
                            <span className="text-ancient-text-muted text-[10px] ml-1 bg-ancient-bg-dark/70 px-1 rounded">
                              (altered)
                            </span>
                          )}
                          {Array.isArray(message.starredBy) &&
                            message.starredBy.some((e) => (e?.userId ?? e) === userInfo.id) && (
                              <FaStar className="text-ancient-icon-glow text-[10px] mb-[2px] bg-ancient-bg-dark/70 px-1 rounded" />
                            )}
                          <span>
                            {message.senderId === userInfo.id && (
                              <MessageStatus MessageStatus={message.messageStatus} />
                            )}
                          </span>
                        </div>
                        <MessageActions message={message} />
                      </div>
                      {/* Reactions summary */}
                      {Array.isArray(message.reactions) && message.reactions.length > 0 && (
                        <div className="flex gap-2 text-xs text-ancient-text-light/80 mt-1">
                          {Object.entries(
                            message.reactions.reduce((acc, r) => {
                              const key = r.emoji || r;
                              acc[key] = (acc[key] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([emoji, count]) => (
                            <span
                              key={emoji}
                              className="px-2 py-[2px] rounded-full bg-ancient-input-bg border border-ancient-border-stone shadow-sm"
                            >
                              {emoji} {count}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Audio message */}
                  {message.type === "audio" && (
                    <div className="flex flex-col max-w-[65%] gap-1">
                      {message.isForwarded && (
                        <span className="self-start text-[10px] text-ancient-text-muted italic">
                          Forwarded Echo
                        </span>
                      )}
                      <VoiceMessage message={message} isIncoming={isIncoming} />{" "}
                      {/* Pass isIncoming for thematic styling */}
                      {Array.isArray(message.reactions) && message.reactions.length > 0 && (
                        <div className="flex gap-2 text-xs text-ancient-text-light/80 mt-1">
                          {Object.entries(
                            message.reactions.reduce((acc, r) => {
                              const key = r.emoji || r;
                              acc[key] = (acc[key] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([emoji, count]) => (
                            <span
                              key={emoji}
                              className="px-2 py-[2px] rounded-full bg-ancient-input-bg border border-ancient-border-stone shadow-sm"
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
          <div className="sticky bottom-4 self-center mt-4 z-10">
            {" "}
            {/* Adjusted position and z-index */}
            <div className="flex items-center gap-3 bg-ancient-bg-medium border border-ancient-border-stone rounded-full px-4 py-2 shadow-lg">
              <button
                className="text-base text-ancient-text-light/90 hover:text-ancient-icon-glow transition-colors duration-200"
                onClick={() => setSelectMode((v) => !v)}
              >
                {selectMode ? "Halt Selection" : "Select Echoes"}
              </button>
              {selectMode && (
                <>
                  <span className="text-ancient-text-muted text-sm">
                    {selectedIds.length} chosen
                  </span>
                  <button
                    className="bg-ancient-icon-glow hover:bg-ancient-bubble-user text-ancient-bg-dark text-sm px-4 py-2 rounded-full disabled:opacity-50 transition-colors duration-200 font-semibold shadow-md"
                    disabled={selectedIds.length === 0}
                    onClick={() => setShowForward(true)}
                  >
                    Forward Echoes
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