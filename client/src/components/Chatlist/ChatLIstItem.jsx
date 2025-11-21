import React, { useState } from "react";
import Avatar from "../common/Avatar";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "../common/MessageStatus";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { getAbsoluteUrl } from "@/lib/url";
import { IoChevronDown } from "react-icons/io5";
import { FaThumbtack } from "react-icons/fa";
import ActionSheet from "@/components/common/ActionSheet";
import { usePinChat } from "@/hooks/mutations/usePinChat";
import { showToast } from "@/lib/toast";

function ChatListItem({ data, isContactsPage = false }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const setCurrentChatUser = useChatStore((s) => s.setCurrentChatUser);
  const setAllContactsPage = useChatStore((s) => s.setAllContactsPage);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleContactClick = () => {
    setCurrentChatUser(data);
    if (isContactsPage) setAllContactsPage(false);
  };

  const isSenderLast = Number(data?.senderId) === Number(userInfo?.id);
  const lastTime = data?.timestamp ? calculateTime(data.timestamp) : "";
  let preview = "";

  if (data?.type === "image") preview = "Ancient Image Echo";
  else if (data?.type === "audio") preview = "Whispered Incantation";
  else preview = data?.message || "No words echo...";

  const pinMutation = usePinChat();
  const onTogglePin = (e) => {
    e.stopPropagation();
    if (!data?.conversationId || !userInfo?.id) return;
    pinMutation.mutate({ conversationId: data.conversationId, pinned: !data?.isPinned, userId: userInfo.id });
    setMenuOpen(false);
  };

  const onArchive = (e) => {
    e.stopPropagation();
    showToast.info("Archive coming soon");
    setMenuOpen(false);
  };
  const onDelete = (e) => {
    e.stopPropagation();
    showToast.info("Delete coming soon");
    setMenuOpen(false);
  };
  const onBlock = (e) => {
    e.stopPropagation();
    showToast.info("Block coming soon");
    setMenuOpen(false);
  };
  const onExit = (e) => {
    e.stopPropagation();
    showToast.info("Exit coming soon");
    setMenuOpen(false);
  };

  const displayName = data?.isSelf
    ? (data?.isPinned ? "Saved messages" : "You")
    : (data?.name || "Unknown Entity");

  return (
    <div
      className="flex items-center py-3 px-4 cursor-pointer bg-ancient-bg-dark hover:bg-ancient-input-bg border-b border-ancient-border-stone transition-colors duration-200 min-h-[76px]"
      onClick={handleContactClick}
    >
      {/* Avatar (left) */}
      <div className="min-w-[56px] pr-4">
        <Avatar
          type="lg"
          image={getAbsoluteUrl(data?.profilePicture || data?.image || data?.profileImage)}
        />
      </div>
      {/* Content (center/right) */}
      <div className="flex-1 flex flex-col justify-center min-h-full">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            {data?.isPinned && (
              <FaThumbtack className="text-ancient-icon-glow text-xs -rotate-12" />
            )}
            <span className="text-ancient-text-light font-bold text-base">
              {displayName}
            </span>
          </div>
          <div className="flex items-center gap-2 relative">
            <span className="text-ancient-text-muted text-xs">{lastTime}</span>
            <button
              type="button"
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-ancient-input-bg text-ancient-text-muted"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <IoChevronDown className="text-lg" />
            </button>
            <ActionSheet
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              align="right"
              placement="below"
              items={[
                { label: "Archive", onClick: onArchive },
                { label: data?.isPinned ? "Unpin" : "Pin", onClick: onTogglePin },
                { label: "Delete", onClick: onDelete, danger: true },
                { label: "Block", onClick: onBlock, danger: true },
                { label: "Exit", onClick: onExit },
              ]}
            />
          </div>
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
