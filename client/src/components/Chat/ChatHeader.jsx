import Avatar from "../common/Avatar";
import { MdCall, MdPermMedia } from "react-icons/md";
import { IoVideocam } from "react-icons/io5";
import { BiSearchAlt2 } from "react-icons/bi";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useCallStore } from "@/stores/callStore";
import { useSocketStore } from "@/stores/socketStore";
import { showToast } from "@/lib/toast";
import { useRef, useState, useMemo } from "react";
import { useContacts } from "@/hooks/queries/useContacts";
import { useClearChat, useDeleteChat, useArchiveChat, usePinChat, useMuteChat } from "@/hooks/mutations/useChatActions";
import GroupManageModal from "./GroupManageModal";
import ActionSheet from "@/components/common/ActionSheet";
import ConfirmModal from "@/components/common/ConfirmModal";
import { getAbsoluteUrl } from "@/lib/url";

function ChatHeader({ onOpenMedia }) {
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const userInfo = useAuthStore((s) => s.userInfo);
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const socket = useSocketStore((s) => s.socket);
  const initiateCall = useCallStore((s) => s.initiateCall);
  const callToastIdRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showGroupManage, setShowGroupManage] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get conversation details
  const { data: contacts = [] } = useContacts(userInfo?.id);
  const contactEntry = useMemo(() => {
    return contacts.find((c) => String(c?.id) === String(currentChatUser?.id));
  }, [contacts, currentChatUser?.id]);
  const conversationId = contactEntry?.conversationId;
  const conversationType = contactEntry?.type;
  const isSelfChat = useMemo(() => {
    return String(currentChatUser?.id) === String(userInfo?.id) || Boolean(contactEntry?.isSelf);
  }, [currentChatUser?.id, userInfo?.id, contactEntry?.isSelf]);
  const isPinned = Boolean(contactEntry?.isPinned);

  // Chat actions
  const clearChat = useClearChat();
  const deleteChat = useDeleteChat();
  const archiveChat = useArchiveChat();
  const pinChat = usePinChat();
  const muteChat = useMuteChat();

  const setCallToast = (fn) => {
    if (callToastIdRef.current) {
      showToast.dismiss(callToastIdRef.current);
      callToastIdRef.current = null;
    }
    callToastIdRef.current = fn();
  };

  const handleVoiceCall = () => {
    if (!currentChatUser || !userInfo) return;
    const call = {
      callType: "audio",
      from: { id: userInfo.id, name: userInfo.name, image: userInfo.profileImage },
      to: { id: currentChatUser.id, name: currentChatUser.name, image: currentChatUser.profilePicture || currentChatUser.image || currentChatUser.profileImage },
    };
    initiateCall(call, "audio");
    socket?.current?.emit?.("call-user", call);
    setCallToast(() => showToast.info("Calling..."));
  };

  const handleVideoCall = () => {
    if (!currentChatUser || !userInfo) return;
    const call = {
      callType: "video",
      from: { id: userInfo.id, name: userInfo.name, image: userInfo.profileImage },
      to: { id: currentChatUser.id, name: currentChatUser.name, image: currentChatUser.profilePicture || currentChatUser.image || currentChatUser.profileImage },
    };
    initiateCall(call, "video");
    socket?.current?.emit?.("call-user", call);
    setCallToast(() => showToast.info("Starting video call..."));
  };

  return (
    <div className="
      w-full
      flex items-center justify-between
      h-16 sm:h-20
      px-3 sm:px-6
      py-2 sm:py-3
      bg-ancient-bg-medium border-b border-ancient-border-stone shadow-md
      transition-all
      ">
      {/* Left: Avatar and name/status */}
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        <Avatar
          type="sm"
          image={getAbsoluteUrl(
            isSelfChat
              ? (userInfo?.profileImage || currentChatUser?.profilePicture || currentChatUser?.image || currentChatUser?.profileImage)
              : (currentChatUser?.profilePicture || currentChatUser?.image || currentChatUser?.profileImage)
          )}
        />
        <div className="flex flex-col min-w-0">
          <span className="text-ancient-text-light text-base sm:text-xl font-bold truncate max-w-[120px] sm:max-w-[220px]">
            {isSelfChat ? (isPinned ? "Saved messages" : "You") : (currentChatUser?.name || currentChatUser?.username || "Unknown")}
          </span>
          <span className="text-ancient-text-muted text-xs sm:text-sm italic truncate max-w-[100px] sm:max-w-[180px]">
            {onlineUsers?.some((u) => String(u) === String(currentChatUser?.id))
              ? "Online"
              : "Offline"}
          </span>
        </div>
      </div>
      {/* Right: Responsive control row */}
      <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto max-w-[73vw] sm:max-w-none flex-nowrap">
        <MdPermMedia
          className="text-ancient-icon-inactive cursor-pointer text-xl sm:text-2xl hover:text-ancient-icon-glow transition"
          title="Media"
          onClick={() => onOpenMedia?.()}
        />
        <MdCall
          className="text-ancient-icon-inactive cursor-pointer text-xl sm:text-2xl hover:text-ancient-icon-glow transition"
          title="Voice Call"
          onClick={handleVoiceCall}
        />
        <IoVideocam
          className="text-ancient-icon-inactive cursor-pointer text-xl sm:text-2xl hover:text-ancient-icon-glow transition"
          title="Video Call"
          onClick={handleVideoCall}
        />
        <BiSearchAlt2
          className="text-ancient-icon-inactive cursor-pointer text-xl sm:text-2xl hover:text-ancient-icon-glow transition"
          title="Search"
          onClick={() => {
            useChatStore.setState({ messageSearch: true });
          }}
        />
        <div className="relative">
          <BsThreeDotsVertical
            className="text-ancient-icon-inactive cursor-pointer text-xl sm:text-2xl hover:text-ancient-icon-glow transition"
            onClick={() => setShowMenu((v) => !v)}
            title="More options"
          />
          <ActionSheet
            open={showMenu}
            onClose={() => setShowMenu(false)}
            align="right"
            items={[
              ...(conversationType === "group"
                ? [{
                    label: "Manage Group",
                    onClick: () => setShowGroupManage(true),
                  }]
                : []),
              {
                label: "Clear Chat",
                disabled: !conversationId || clearChat.isPending,
                onClick: () => {
                  if (!conversationId) return;
                  setShowClearConfirm(true);
                },
              },
              {
                label: "Delete Chat",
                disabled: !conversationId || deleteChat.isPending,
                onClick: () => {
                  if (!conversationId) return;
                  setShowDeleteConfirm(true);
                },
                danger: true,
              },
              {
                label: "Archive Chat",
                disabled: !conversationId || archiveChat.isPending,
                onClick: () => {
                  if (!conversationId) return;
                  archiveChat.mutate({ chatId: conversationId, archive: true });
                },
              },
              {
                label: "Pin Chat",
                disabled: !conversationId || pinChat.isPending,
                onClick: () => {
                  if (!conversationId) return;
                  pinChat.mutate({ chatId: conversationId, pin: true });
                },
              },
              {
                label: "Mute for 24 hours",
                disabled: !conversationId || muteChat.isPending,
                onClick: () => {
                  if (!conversationId) return;
                  const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                  muteChat.mutate({ chatId: conversationId, mutedUntil: until });
                },
              },
            ]}
          />
        </div>
      </div>
      <GroupManageModal open={showGroupManage} onClose={() => setShowGroupManage(false)} groupId={conversationId} />

      {/* Confirm: Clear Chat */}
      <ConfirmModal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          if (!conversationId) return;
          clearChat.mutate(
            { chatId: conversationId },
            { onSuccess: () => setShowClearConfirm(false) }
          );
        }}
        title="Clear this chat?"
        description="This will remove messages from your device for this conversation. It does not delete for the other participant."
        confirmText={clearChat.isPending ? "Clearing..." : "Clear"}
        confirmLoading={clearChat.isPending}
        variant="warning"
      />

      {/* Confirm: Delete Chat */}
      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          if (!conversationId) return;
          deleteChat.mutate(
            { chatId: conversationId },
            { onSuccess: () => setShowDeleteConfirm(false) }
          );
        }}
        title="Delete this chat?"
        description="This will permanently delete the conversation from your chats list. It does not delete messages for the other participant."
        confirmText={deleteChat.isPending ? "Deleting..." : "Delete"}
        confirmLoading={deleteChat.isPending}
        variant="danger"
      />
    </div>
  );
}

export default ChatHeader;
