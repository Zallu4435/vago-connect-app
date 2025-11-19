import React from "react";
import Avatar from "../common/Avatar";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "../common/MessageStatus";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";

function ChatListItem({ data, isContactsPage = false }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const setCurrentChatUser = useChatStore((s) => s.setCurrentChatUser);
  const setAllContactsPage = useChatStore((s) => s.setAllContactsPage);

  const handleContactClick = () => {
    setCurrentChatUser(data);
    if (isContactsPage) setAllContactsPage(false);
  };

  const isSenderLast = data?.senderId === userInfo?.id;
  const lastTime = data?.timestamp ? calculateTime(data.timestamp) : "";
  let preview = "";

  if (data?.type === "image") preview = "Ancient Image Echo";
  else if (data?.type === "audio") preview = "Whispered Incantation";
  else preview = data?.message || "No words echo...";

  return (
    <div
      className="flex items-center py-3 px-4 cursor-pointer bg-ancient-bg-dark hover:bg-ancient-input-bg border-b border-ancient-border-stone transition-colors duration-200 min-h-[76px]"
      onClick={handleContactClick}
    >
      {/* Avatar (left) */}
      <div className="min-w-[56px] pr-4">
        <Avatar
          type="lg"
          image={data?.profilePicture || data?.image || data?.profileImage}
        />
      </div>
      {/* Content (center/right) */}
      <div className="flex-1 flex flex-col justify-center min-h-full">
        <div className="flex justify-between items-center mb-1">
          <span className="text-ancient-text-light font-bold text-base">
            {data?.name || "Unknown Entity"}
          </span>
          <span className="text-ancient-text-muted text-xs ml-3">
            {lastTime}
          </span>
        </div>
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isSenderLast && (
              <span className="text-ancient-text-muted text-xs">
                <MessageStatus MessageStatus={data?.messageStatus} />
              </span>
            )}
            <span className="text-ancient-text-muted line-clamp-1 text-sm break-all w-full">
              {preview}
            </span>
          </div>
          {data?.totalUnreadMessages > 0 && (
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-ancient-icon-glow text-ancient-bg-dark text-xs font-semibold flex items-center justify-center min-w-[24px] shadow-sm animate-pulse-glow h-6">
              {data.totalUnreadMessages}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatListItem;
