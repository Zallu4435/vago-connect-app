import Avatar from "../common/Avatar";
import { MdArrowBack, MdCall, MdVideocam } from "react-icons/md";
import { BiSearchAlt2 } from "react-icons/bi";
import { BsThreeDotsVertical } from "react-icons/bs";
import { MdPermMedia } from "react-icons/md";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useCallStore } from "@/stores/callStore";
import { useSocketStore } from "@/stores/socketStore";
import { showToast } from "@/lib/toast";
import { useRef, useState } from "react";
import { useContacts } from '@/hooks/contacts/useContacts';
import { useClearChat, useDeleteChat } from '@/hooks/chat/useChatActions';
import { usePinChat } from '@/hooks/chat/usePinChat';
import { useLeaveGroup } from '@/hooks/groups/useGroupActions';
import { useBlockUser } from '@/hooks/contacts/useBlockUser';
import ActionSheet from "@/components/common/ActionSheet";
import { useRenderLog } from "@/hooks/ui/useRenderLog";
import ConfirmModal from "@/components/common/ConfirmModal";
import { getAbsoluteUrl } from "@/lib/url";
import { getAvatarUrl } from "@/utils/chatHelpers";


function ChatHeader({ onOpenMedia, onOpenGroupManage }) {
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const setCurrentChatUser = useChatStore((s) => s.setCurrentChatUser);
  const userInfo = useAuthStore((s) => s.userInfo);
  const messages = useChatStore((s) => s.messages);
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const socket = useSocketStore((s) => s.socket);
  const initiateCall = useCallStore((s) => s.initiateCall);
  const callToastIdRef = useRef(null);
  const menuButtonRef = useRef(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Get conversation details
  const { data: contacts = [] } = useContacts(userInfo?.id);
  const contactEntry = contacts.find((c) => String(c?.id) === String(currentChatUser?.id));
  const conversationId = contactEntry?.conversationId;
  const conversationType = contactEntry?.type;
  const isSelfChat = String(currentChatUser?.id) === String(userInfo?.id) || Boolean(contactEntry?.isSelf);
  const isPinned = Boolean(contactEntry?.isPinned);
  const isBlocked = Boolean(contactEntry?.isBlocked);
  const blockedBy = Boolean(contactEntry?.blockedBy);
  const isOnline = onlineUsers?.some((u) => String(u) === String(currentChatUser?.id));
  const isTyping = typingUsers?.some((u) => String(u) === String(currentChatUser?.id));
  const isGroupChat = conversationType === "group" || currentChatUser?.isGroup;
  const hasMessages = messages && messages.length > 0;

  useRenderLog("ChatHeader", { currentChatUser, isGroupChat });

  // Chat actions
  const clearChat = useClearChat();
  const deleteChat = useDeleteChat();
  const pinChat = usePinChat();
  const leaveGroup = useLeaveGroup();
  const blockUser = useBlockUser();

  const setCallToast = (fn) => {
    if (callToastIdRef.current) {
      showToast.dismiss(callToastIdRef.current);
      callToastIdRef.current = null;
    }
    callToastIdRef.current = fn();
  };

  const handleVoiceCall = () => {
    if (!currentChatUser || !userInfo) return;
    if (isBlocked || blockedBy) {
      showToast.error("Cannot call a blocked contact");
      return;
    }

    // Simulate connecting state
    setCallToast(() => showToast.loading("Initiating call..."));

    setTimeout(() => {
      // Check if user is offline before dialing
      if (!isOnline) {
        setCallToast(() => showToast.error("User is unavailable for a call right now."));
        return;
      }

      // User is online, proceed with dialing
      const call = {
        callType: "audio",
        from: { id: userInfo.id, name: userInfo.name, image: userInfo.profileImage },
        to: {
          id: currentChatUser.id,
          name: currentChatUser.name,
          image: currentChatUser.profilePicture || currentChatUser.image || currentChatUser.profileImage
        },
      };
      initiateCall(call, "audio");
      socket?.current?.emit?.("call-user", call);
      setCallToast(() => showToast.success("Ringing..."));
    }, 1500);
  };

  const handleVideoCall = () => {
    if (!currentChatUser || !userInfo) return;
    if (isBlocked || blockedBy) {
      showToast.error("Cannot call a blocked contact");
      return;
    }

    // Simulate connecting state
    setCallToast(() => showToast.loading("Initiating video call..."));

    setTimeout(() => {
      // Check if user is offline before dialing
      if (!isOnline) {
        setCallToast(() => showToast.error("User is unavailable for a video call right now."));
        return;
      }

      // User is online, proceed with dialing
      const call = {
        callType: "video",
        from: { id: userInfo.id, name: userInfo.name, image: userInfo.profileImage },
        to: {
          id: currentChatUser.id,
          name: currentChatUser.name,
          image: currentChatUser.profilePicture || currentChatUser.image || currentChatUser.profileImage
        },
      };
      initiateCall(call, "video");
      socket?.current?.emit?.("call-user", call);
      setCallToast(() => showToast.success("Ringing..."));
    }, 1500);
  };

  return (
    <div className="w-full flex items-center justify-between h-16 sm:h-18 px-4 sm:px-6 bg-ancient-bg-medium border-b border-ancient-border-stone shadow-md">
      {/* Left: Back + Avatar + Name/Status */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Back button (mobile only) */}
        <button
          type="button"
          aria-label="Back to chats"
          className="md:hidden p-2 -ml-2 rounded-full hover:bg-ancient-bg-dark/60 active:scale-95 transition-all"
          onClick={() => setCurrentChatUser(null)}
        >
          <MdArrowBack className="text-xl text-ancient-text-light" />
        </button>

        {conversationType !== "direct" && (
          <Avatar
            type="sm"
            image={getAbsoluteUrl(getAvatarUrl(currentChatUser, userInfo, isSelfChat))}
            isGroup={true}
          />
        )}

        <div className="flex flex-col min-w-0 flex-1 cursor-pointer" onClick={() => (conversationType === "group" || currentChatUser?.isGroup) && onOpenGroupManage?.()}>
          <span className="text-ancient-text-light text-base sm:text-lg font-semibold truncate hover:underline">
            {isSelfChat
              ? (isPinned ? "Saved messages" : "You")
              : (currentChatUser?.name || currentChatUser?.username || "Unknown")}
          </span>
          <span className="text-ancient-text-muted text-xs sm:text-sm truncate hover:underline">
            {conversationType === "group" || currentChatUser?.isGroup ? (
              (currentChatUser?.participants || contactEntry?.participants || [])
                .map((p) => String(p.userId) === String(userInfo?.id) ? "You" : (p.user?.name?.split(" ")[0] || "Unknown"))
                .join(", ") || "Tap here for group info"
            ) : isSelfChat ? (
              "Keep notes and links handy"
            ) : isBlocked || blockedBy ? (
              ""
            ) : isTyping ? (
              <span className="text-ancient-icon-glow italic">typing...</span>
            ) : isOnline ? (
              "Online"
            ) : (
              "Offline"
            )}
          </span>
        </div>
      </div>

      {/* Right: Action Icons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {!isGroupChat && (
          <button
            className="p-2 rounded-full hover:bg-ancient-bg-dark/60 transition-all active:scale-95"
            title="Video Call"
            onClick={handleVideoCall}
          >
            <MdVideocam className="text-ancient-icon-inactive hover:text-ancient-icon-glow text-xl sm:text-2xl transition-colors" />
          </button>
        )}

        <button
          className={`p-2 rounded-full transition-all active:scale-95 ${hasMessages ? "hover:bg-ancient-bg-dark/60" : "opacity-50 cursor-not-allowed"}`}
          title="Search"
          onClick={() => hasMessages && useChatStore.setState({ messageSearch: true })}
          disabled={!hasMessages}
        >
          <BiSearchAlt2 className="text-ancient-icon-inactive hover:text-ancient-icon-glow text-xl sm:text-2xl transition-colors" />
        </button>

        <div className="relative">
          <button
            ref={menuButtonRef}
            className="p-2 rounded-full hover:bg-ancient-bg-dark/60 transition-all active:scale-95"
            onClick={() => setShowMenu((v) => !v)}
            title="More options"
          >
            <BsThreeDotsVertical className="text-ancient-icon-inactive hover:text-ancient-icon-glow text-xl sm:text-2xl transition-colors" />
          </button>

          <ActionSheet
            open={showMenu}
            onClose={() => setShowMenu(false)}
            align="right"
            anchorRef={menuButtonRef}
            items={[
              {
                label: "Media",
                icon: MdPermMedia,
                disabled: !hasMessages || (isBlocked || blockedBy),
                onClick: () => onOpenMedia?.(),
              },
              ...(isGroupChat ? [] : [{
                label: "Voice Call",
                icon: MdCall,
                disabled: isBlocked || blockedBy,
                onClick: handleVoiceCall,
              }]),
              ...(isGroupChat
                ? [{
                  label: "Manage Group",
                  onClick: () => onOpenGroupManage?.(),
                }]
                : []),
              {
                label: "Clear Chat",
                disabled: !conversationId || clearChat.isPending || !hasMessages,
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
              ...(isSelfChat ? [] : [{
                label: isPinned ? "Unpin Chat" : "Pin Chat",
                disabled: !conversationId || pinChat.isPending,
                onClick: () => {
                  if (!conversationId) return;
                  pinChat.mutate({ conversationId, pinned: !isPinned, userId: userInfo?.id });
                },
              }]),
              ...(isGroupChat || isSelfChat ? [] : [{
                label: isBlocked ? "Unblock User" : "Block User",
                disabled: !currentChatUser?.id || blockUser.isPending || (!isBlocked && blockedBy),
                onClick: () => setShowBlockConfirm(true),
                danger: !isBlocked,
              }]),
              ...(isGroupChat ? [{
                label: "Exit Group",
                disabled: !conversationId || leaveGroup.isPending,
                onClick: () => setShowExitConfirm(true),
                danger: true,
              }] : []),
            ]}
          />
        </div>
      </div>

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
            { onSuccess: () => { setShowDeleteConfirm(false); setCurrentChatUser(null); } }
          );
        }}
        title="Delete this chat?"
        description="This will permanently delete the conversation from your chats list. It does not delete messages for the other participant."
        confirmText={deleteChat.isPending ? "Deleting..." : "Delete"}
        confirmLoading={deleteChat.isPending}
        variant="danger"
      />

      {/* Confirm: Block User */}
      <ConfirmModal
        open={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={() => {
          const targetId = currentChatUser?.id;
          if (!targetId) return;
          blockUser.mutate(
            { userId: targetId, block: !isBlocked },
            { onSuccess: () => setShowBlockConfirm(false) }
          );
        }}
        title={`${isBlocked ? 'Unblock' : 'Block'} ${currentChatUser?.name || currentChatUser?.username}?`}
        description={isBlocked ? "This contact will be able to call you or send you messages again." : "Blocked contacts will no longer be able to call you or send you messages."}
        confirmText={blockUser.isPending ? (isBlocked ? "Unblocking..." : "Blocking...") : (isBlocked ? "Unblock" : "Block")}
        confirmLoading={blockUser.isPending}
        variant={isBlocked ? "primary" : "danger"}
      />

      {/* Confirm: Exit Group */}
      <ConfirmModal
        open={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={() => {
          if (!conversationId) return;
          leaveGroup.mutate(
            conversationId,
            { onSuccess: () => { setShowExitConfirm(false); setCurrentChatUser(null); } }
          );
        }}
        title={`Exit "${currentChatUser?.name || currentChatUser?.username || 'Group'}"?`}
        description="Are you sure you want to exit this group? You will no longer receive messages from this group."
        confirmText={leaveGroup.isPending ? "Exiting..." : "Exit Group"}
        confirmLoading={leaveGroup.isPending}
        variant="danger"
      />
    </div>
  );
}

export default ChatHeader;
