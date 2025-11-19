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

  if (data?.type === "image") preview = "Photo";
  else if (data?.type === "audio") preview = "Voice message";
  else preview = data?.message || "\u00A0"; // Unicode non-breaking space for empty

  return (
    <div
      className="flex cursor-pointer items-center hover:bg-bg-default-hover transition-colors duration-200 px-4 py-2"
      onClick={handleContactClick}
    >
      <div className="min-w-fit px-3">
        <Avatar
          type="lg"
          image={data?.profilePicture || data?.image || data?.profileImage}
        />
      </div>
      <div className="flex-1 flex flex-col justify-center ml-3 min-h-full">
        <div className="flex justify-between items-center mb-1">
          <span className="text-text-primary font-medium">{data?.name}</span>
          <span className="text-secondary text-xs">{lastTime}</span>
        </div>
        <div className="flex items-center border-b border-conversation-border pb-1 pt-1 w-full gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isSenderLast && (
              <span className="text-secondary">
                <MessageStatus MessageStatus={data?.messageStatus} />
              </span>
            )}
            <span className="text-secondary line-clamp-1 text-sm break-all w-full">
              {preview}
            </span>
          </div>
          {data?.totalUnreadMessages > 0 && (
            <span className="ml-2 px-2 h-5 rounded-full bg-[#25d366] text-[#111b21] text-xs font-semibold flex items-center justify-center min-w-[20px]">
              {data.totalUnreadMessages}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatListItem;
