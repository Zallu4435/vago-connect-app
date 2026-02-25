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
import { useDeleteChat, useClearChat } from "@/hooks/mutations/useChatActions";
import { useLeaveGroup } from "@/hooks/mutations/useGroupActions";
import { useBlockUser } from "@/hooks/mutations/useBlockUser";
import ConfirmModal from "@/components/common/ConfirmModal";
import { showToast } from "@/lib/toast";

function ChatListItem({ data, isContactsPage = false }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const setCurrentChatUser = useChatStore((s) => s.setCurrentChatUser);
  const setAllContactsPage = useChatStore((s) => s.setAllContactsPage);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const menuBtnRef = useRef(null);

  const handleContactClick = () => {
    if (showDeleteConfirm || showClearConfirm || showBlockConfirm || showExitConfirm) return;
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
    e?.stopPropagation?.();
    if (!data?.conversationId || !userInfo?.id) return;
    pinMutation.mutate({ conversationId: data.conversationId, pinned: !data?.isPinned, userId: userInfo.id });
    setMenuOpen(false);
  };

  const deleteChat = useDeleteChat();
  const clearChat = useClearChat();
  const leaveGroup = useLeaveGroup();
  const blockUser = useBlockUser();

  const onDelete = (e) => { e?.stopPropagation?.(); setShowDeleteConfirm(true); setMenuOpen(false); };
  const onClear = (e) => { e?.stopPropagation?.(); setShowClearConfirm(true); setMenuOpen(false); };
  const onBlock = (e) => { e?.stopPropagation?.(); setShowBlockConfirm(true); setMenuOpen(false); };
  const onExit = (e) => { e?.stopPropagation?.(); setShowExitConfirm(true); setMenuOpen(false); };

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
              onClick={(e) => { e?.stopPropagation?.(); setMenuOpen((v) => !v); }}
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
              placement="bottom"
              anchorRef={menuBtnRef}
              items={[
                // Hide Pin for Self Chat
                ...(data?.isSelf ? [] : [{ label: data?.isPinned ? "Unpin" : "Pin", onClick: onTogglePin }]),
                { label: "Clear Chat", onClick: onClear },
                { label: "Delete", onClick: onDelete, danger: true },
                // Hide Block for Groups and Self Chat
                ...(data?.isGroup || data?.type === "group" || data?.isSelf ? [] : [{ label: "Block", onClick: onBlock, danger: true }]),
                // Show Exit ONLY for Groups
                ...(data?.isGroup || data?.type === "group" ? [{ label: "Exit Group", onClick: onExit, danger: true }] : []),
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

      {/* Confirm: Clear Chat */}
      <ConfirmModal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={(e) => {
          e?.stopPropagation?.();
          if (!data?.conversationId) return;
          clearChat.mutate(
            { chatId: data.conversationId },
            { onSuccess: () => setShowClearConfirm(false) }
          );
        }}
        title="Clear this chat?"
        description="This will remove messages from your device for this conversation."
        confirmText={clearChat.isPending ? "Clearing..." : "Clear"}
        confirmLoading={clearChat.isPending}
        variant="warning"
      />

      {/* Confirm: Delete Chat */}
      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={(e) => {
          e?.stopPropagation?.();
          if (!data?.conversationId) return;
          deleteChat.mutate(
            { chatId: data.conversationId },
            { onSuccess: () => setShowDeleteConfirm(false) }
          );
        }}
        title="Delete this chat?"
        description="This will permanently delete the conversation from your chats list."
        confirmText={deleteChat.isPending ? "Deleting..." : "Delete"}
        confirmLoading={deleteChat.isPending}
        variant="danger"
      />

      {/* Confirm: Block User */}
      <ConfirmModal
        open={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={(e) => {
          e?.stopPropagation?.();
          const targetId = data?.id || data?.user?.id;
          if (!targetId) return;
          blockUser.mutate(
            { userId: targetId, block: true },
            { onSuccess: () => setShowBlockConfirm(false) }
          );
        }}
        title={`Block ${displayName}?`}
        description="Blocked contacts will no longer be able to call you or send you messages."
        confirmText={blockUser.isPending ? "Blocking..." : "Block"}
        confirmLoading={blockUser.isPending}
        variant="danger"
      />

      {/* Confirm: Exit Group */}
      <ConfirmModal
        open={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={(e) => {
          e?.stopPropagation?.();
          if (!data?.conversationId) return;
          leaveGroup.mutate(
            data.conversationId,
            { onSuccess: () => setShowExitConfirm(false) }
          );
        }}
        title={`Exit "${displayName}"?`}
        description="Are you sure you want to exit this group? You will no longer receive messages from this group."
        confirmText={leaveGroup.isPending ? "Exiting..." : "Exit Group"}
        confirmLoading={leaveGroup.isPending}
        variant="danger"
      />
    </div>
  );
}

export default ChatListItem;
