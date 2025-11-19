import Avatar from "../common/Avatar";
import { MdCall } from "react-icons/md";
import { IoVideocam } from "react-icons/io5";
import { BiSearchAlt2 } from "react-icons/bi";
import { BsThreeDotsVertical } from "react-icons/bs";
import { MdPermMedia } from "react-icons/md";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useCallStore } from "@/stores/callStore";
import { useSocketStore } from "@/stores/socketStore";
import { showToast } from "@/lib/toast";
import { useRef, useState, useMemo } from "react";
import { useContacts } from "@/hooks/queries/useContacts";
import { useClearChat, useDeleteChat, useArchiveChat, usePinChat, useMuteChat } from "@/hooks/mutations/useChatActions";
import GroupManageModal from "./GroupManageModal";

function ChatHeader({ onOpenMedia }) {
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const userInfo = useAuthStore((s) => s.userInfo);
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const socket = useSocketStore((s) => s.socket);
  const initiateCall = useCallStore((s) => s.initiateCall);
  const callToastIdRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showGroupManage, setShowGroupManage] = useState(false);

  // Resolve conversationId for maintenance actions
  const { data: contacts = [] } = useContacts(userInfo?.id);
  const conversationId = useMemo(() => {
    const item = (contacts || []).find((c) => String(c?.user?.id) === String(currentChatUser?.id));
    return item?.conversationId;
  }, [contacts, currentChatUser?.id]);
  const conversationType = useMemo(() => {
    const item = (contacts || []).find((c) => String(c?.user?.id) === String(currentChatUser?.id));
    return item?.type;
  }, [contacts, currentChatUser?.id]);

  // Hooks for actions
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
  }

  const handleVideoCall = () => {
    if (!currentChatUser || !userInfo) return;
    const call = {
      callType: "video",
      from: { id: userInfo.id, name: userInfo.name, image: userInfo.profileImage },
      to: { id: currentChatUser.id, name: currentChatUser.name, image: currentChatUser.profilePicture || currentChatUser.image || currentChatUser.profileImage },
    };
    initiateCall(call, "video");
    socket?.current?.emit?.("call-user", call);
    setCallToast(() => showToast.info("Calling..."));
  }
  
  return (
    <div className="h-16 px-4 py-3 flex justify-between items-center bg-panel-header-background">
      <div className="flex items-center justify-center gap-6">
        <Avatar
          type="sm"
          image={
            currentChatUser?.profilePicture ||
            currentChatUser?.image ||
            currentChatUser?.profileImage
          }
        />
        <div className="flex flex-col">
          <span className="text-primary-strong">{currentChatUser?.name || currentChatUser?.username}</span>
          <span className="text-secondary text-sm">
            {onlineUsers?.some((u) => String(u) === String(currentChatUser?.id)) ? 'online' : 'offline'}
          </span>
        </div>
      </div>
      <div className="flex gap-6">
        <MdPermMedia
          className="text-panel-header-icon cursor-pointer text-xl"
          title="Media"
          onClick={() => onOpenMedia?.()}
        />
        <MdCall
          className="text-panel-header-icon cursor-pointer text-xl"
          onClick={handleVoiceCall}
        />
        <IoVideocam
          className="text-panel-header-icon cursor-pointer text-xl"
          onClick={handleVideoCall}
        />
        <BiSearchAlt2
          className="text-panel-header-icon cursor-pointer text-xl"
          onClick={() => {
            // Force messageSearch to true without toggling
            useChatStore.setState({ messageSearch: true });
          }}
        />
        <div className="relative">
          <BsThreeDotsVertical
            className="text-panel-header-icon cursor-pointer text-xl"
            onClick={() => setShowMenu((v) => !v)}
            title="Menu"
          />
          {showMenu && (
            <div className="absolute right-0 mt-2 z-20 w-48 bg-[#1f2c33] border border-[#2a3942] rounded-md shadow-lg p-1">
              {conversationType === 'group' && (
                <button
                  className="w-full text-left px-3 py-2 hover:bg-[#2a3942] text-sm"
                  onClick={() => { setShowGroupManage(true); setShowMenu(false); }}
                >
                  Group settings
                </button>
              )}
              <button
                className="w-full text-left px-3 py-2 hover:bg-[#2a3942] text-sm"
                disabled={!conversationId || clearChat.isPending}
                onClick={() => {
                  if (!conversationId) return;
                  clearChat.mutate({ chatId: conversationId });
                  setShowMenu(false);
                }}
              >
                Clear chat
              </button>
              <button
                className="w-full text-left px-3 py-2 hover:bg-[#2a3942] text-sm"
                disabled={!conversationId || deleteChat.isPending}
                onClick={() => {
                  if (!conversationId) return;
                  deleteChat.mutate({ chatId: conversationId });
                  setShowMenu(false);
                }}
              >
                Delete chat
              </button>
              <button
                className="w-full text-left px-3 py-2 hover:bg-[#2a3942] text-sm"
                disabled={!conversationId || archiveChat.isPending}
                onClick={() => {
                  if (!conversationId) return;
                  archiveChat.mutate({ chatId: conversationId, archive: true });
                  setShowMenu(false);
                }}
              >
                Archive chat
              </button>
              <button
                className="w-full text-left px-3 py-2 hover:bg-[#2a3942] text-sm"
                disabled={!conversationId || pinChat.isPending}
                onClick={() => {
                  if (!conversationId) return;
                  pinChat.mutate({ chatId: conversationId, pin: true });
                  setShowMenu(false);
                }}
              >
                Pin chat
              </button>
              <button
                className="w-full text-left px-3 py-2 hover:bg-[#2a3942] text-sm"
                disabled={!conversationId || muteChat.isPending}
                onClick={() => {
                  if (!conversationId) return;
                  // Default mute 24h
                  const until = new Date(Date.now() + 24*60*60*1000).toISOString();
                  muteChat.mutate({ chatId: conversationId, mutedUntil: until });
                  setShowMenu(false);
                }}
              >
                Mute 24h
              </button>
            </div>
          )}
        </div>
      </div>
      <GroupManageModal open={showGroupManage} onClose={() => setShowGroupManage(false)} groupId={conversationId} />
    </div>
  );
}

export default ChatHeader;
