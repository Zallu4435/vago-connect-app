import React, { useRef, useState } from "react";
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
  const menuBtnRef = useRef(null);

  const handleContactClick = () => {
    setCurrentChatUser(data);
    if (isContactsPage) setAllContactsPage(false);
  };

  const isSenderLast = Number(data?.senderId) === Number(userInfo?.id);
  const lastTime = data?.timestamp ? calculateTime(data.timestamp) : "";
  let preview = "";

  if (isContactsPage) {
    preview = data?.about || "Available";
  } else {
    if (data?.type === "image") preview = "Image";
    else if (data?.type === "audio") preview = "Voice message";
    else preview = data?.message || "No messages yet";
  }

  const pinMutation = usePinChat();
  const onTogglePin = (e) => {
    e.stopPropagation();
    if (!data?.conversationId || !userInfo?.id) return;
    pinMutation.mutate({ conversationId: data.conversationId, pinned: !data?.isPinned, userId: userInfo.id });
    setMenuOpen(false);
  };

  const onArchive = (e) => { e.stopPropagation(); showToast.info("Archive coming soon"); setMenuOpen(false); };
  const onDelete = (e) => { e.stopPropagation(); showToast.info("Delete coming soon"); setMenuOpen(false); };
  const onBlock = (e) => { e.stopPropagation(); showToast.info("Block coming soon"); setMenuOpen(false); };
  const onExit = (e) => { e.stopPropagation(); showToast.info("Exit coming soon"); setMenuOpen(false); };

  const displayName = data?.isSelf
    ? (data?.isPinned ? "Saved messages" : ((data?.name || data?.username || userInfo?.name) ? `${data?.name || data?.username || userInfo?.name} (You)` : "You"))
    : (data?.name || data?.username || "Unknown User");

  return (
    <div
      className="
        flex items-center py-3 px-2 sm:px-4 cursor-pointer
        bg-ancient-bg-dark hover:bg-ancient-input-bg border-b border-ancient-border-stone
        transition-colors duration-200 min-h-[72px] sm:min-h-[76px] gap-0 sm:gap-1
      "
      onClick={handleContactClick}
    >
      {/* Avatar (left) */}
      <div className="min-w-[48px] sm:min-w-[56px] pr-2 sm:pr-4">
        <Avatar
          type="lg"
          image={getAbsoluteUrl(data?.profilePicture || data?.image || data?.profileImage)}
          isGroup={data?.isGroup}
        />
      </div>
      {/* Content (center/right) */}
      <div className="flex-1 flex flex-col justify-center min-h-full overflow-hidden">
        <div className="flex justify-between items-center mb-1 gap-2">
          <div className="flex items-center gap-1 sm:gap-2 max-w-[65vw] truncate">
            {data?.isPinned && (
              <FaThumbtack className="text-ancient-icon-glow text-xs -rotate-12 shrink-0" />
            )}
            <span className="text-ancient-text-light font-bold text-sm sm:text-base truncate">
              {displayName}
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 relative">
            <span className="text-ancient-text-muted text-xs whitespace-nowrap">{lastTime}</span>
            <button
              type="button"
              className="
                w-7 h-7 flex items-center justify-center rounded
                hover:bg-ancient-input-bg text-ancient-text-muted
                transition
              "
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              ref={menuBtnRef}
            >
              <IoChevronDown className="text-base sm:text-lg" />
            </button>
            <ActionSheet
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              align="right"
              placement="below"
              anchorRef={menuBtnRef}
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
                <MessageStatus status={data?.messageStatus} />
              </span>
            )}
            <span className="text-ancient-text-muted line-clamp-1 text-xs sm:text-sm break-all w-full">
              {preview}
            </span>
          </div>
          {data?.totalUnreadMessages > 0 && (
            <span className="
              ml-2 px-2 py-0.5 sm:px-2.5 rounded-full bg-ancient-icon-glow text-ancient-bg-dark text-xs font-semibold
              flex items-center justify-center min-w-[20px] sm:min-w-[24px] shadow-sm animate-pulse-glow h-5 sm:h-6
            ">
              {data.totalUnreadMessages}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatListItem;
