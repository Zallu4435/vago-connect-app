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

function ChatHeader({ onOpenMedia }) {
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const userInfo = useAuthStore((s) => s.userInfo);
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const socket = useSocketStore((s) => s.socket);
  const initiateCall = useCallStore((s) => s.initiateCall);
  const callToastIdRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showGroupManage, setShowGroupManage] = useState(false);

  // Get conversation ID and type from contacts
  const { data: contacts = [] } = useContacts(userInfo?.id);
  const conversationId = useMemo(() => {
    const item = contacts.find((c) => String(c?.user?.id) === String(currentChatUser?.id));
    return item?.conversationId;
  }, [contacts, currentChatUser?.id]);
  const conversationType = useMemo(() => {
    const item = contacts.find((c) => String(c?.user?.id) === String(currentChatUser?.id));
    return item?.type;
  }, [contacts, currentChatUser?.id]);

  // Maintenance action hooks
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
    setCallToast(() => showToast.info("Summoning via Whisper..."));
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
    setCallToast(() => showToast.info("Conjuring Vision Link..."));
  };

  return (
    <div className="h-20 px-6 py-3 flex items-center justify-between bg-ancient-bg-medium border-b border-ancient-border-stone shadow-md">
      {/* Left: Avatar and name/status */}
      <div className="flex items-center gap-6">
        <Avatar
          type="sm"
          image={
            currentChatUser?.profilePicture ||
            currentChatUser?.image ||
            currentChatUser?.profileImage
          }
        />
        <div className="flex flex-col">
          <span className="text-ancient-text-light text-xl font-bold">
            {currentChatUser?.name || currentChatUser?.username || "Ancient Echo"}
          </span>
          <span className="text-ancient-text-muted text-sm italic">
            {onlineUsers?.some((u) => String(u) === String(currentChatUser?.id))
              ? "Connected to the Void"
              : "Lost in the Mists"}
          </span>
        </div>
      </div>
      {/* Right: Controls */}
      <div className="flex items-center gap-7">
        <MdPermMedia
          className="text-ancient-icon-inactive cursor-pointer text-2xl hover:text-ancient-icon-glow transition"
          title="Ancient Archive"
          onClick={() => onOpenMedia?.()}
        />
        <MdCall
          className="text-ancient-icon-inactive cursor-pointer text-2xl hover:text-ancient-icon-glow transition"
          title="Summon via Whisper"
          onClick={handleVoiceCall}
        />
        <IoVideocam
          className="text-ancient-icon-inactive cursor-pointer text-2xl hover:text-ancient-icon-glow transition"
          title="Conjure Vision Link"
          onClick={handleVideoCall}
        />
        <BiSearchAlt2
          className="text-ancient-icon-inactive cursor-pointer text-2xl hover:text-ancient-icon-glow transition"
          title="Seek Ancient Runes"
          onClick={() => {
            useChatStore.setState({ messageSearch: true });
          }}
        />
        <div className="relative">
          <BsThreeDotsVertical
            className="text-ancient-icon-inactive cursor-pointer text-2xl hover:text-ancient-icon-glow transition"
            onClick={() => setShowMenu((v) => !v)}
            title="Ancient Rites Menu"
          />
          {/* Dropdown menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 z-30 w-56 bg-ancient-bg-dark border border-ancient-border-stone rounded-xl shadow-xl p-2 animate-fade-in-down origin-top-right">
              {conversationType === "group" && (
                <button
                  className="w-full text-left px-4 py-3 hover:bg-ancient-bubble-user text-ancient-text-light text-base rounded-md"
                  onClick={() => {
                    setShowGroupManage(true);
                    setShowMenu(false);
                  }}
                >
                  Manage Circle
                </button>
              )}
              <button
                className="w-full text-left px-4 py-3 hover:bg-ancient-bubble-user text-ancient-text-light text-base rounded-md"
                disabled={!conversationId || clearChat.isPending}
                onClick={() => {
                  if (!conversationId) return;
                  clearChat.mutate({ chatId: conversationId });
                  setShowMenu(false);
                }}
              >
                Erase Scrolls
              </button>
              <button
                className="w-full text-left px-4 py-3 hover:bg-ancient-bubble-user text-ancient-text-light text-base rounded-md"
                disabled={!conversationId || deleteChat.isPending}
                onClick={() => {
                  if (!conversationId) return;
                  deleteChat.mutate({ chatId: conversationId });
                  setShowMenu(false);
                }}
              >
                Banish Echoes
              </button>
              <button
                className="w-full text-left px-4 py-3 hover:bg-ancient-bubble-user text-ancient-text-light text-base rounded-md"
                disabled={!conversationId || archiveChat.isPending}
                onClick={() => {
                  if (!conversationId) return;
                  archiveChat.mutate({ chatId: conversationId, archive: true });
                  setShowMenu(false);
                }}
              >
                Seal to Archive
              </button>
              <button
                className="w-full text-left px-4 py-3 hover:bg-ancient-bubble-user text-ancient-text-light text-base rounded-md"
                disabled={!conversationId || pinChat.isPending}
                onClick={() => {
                  if (!conversationId) return;
                  pinChat.mutate({ chatId: conversationId, pin: true });
                  setShowMenu(false);
                }}
              >
                Mark with Rune
              </button>
              <button
                className="w-full text-left px-4 py-3 hover:bg-ancient-bubble-user text-ancient-text-light text-base rounded-md"
                disabled={!conversationId || muteChat.isPending}
                onClick={() => {
                  if (!conversationId) return;
                  const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                  muteChat.mutate({ chatId: conversationId, mutedUntil: until });
                  setShowMenu(false);
                }}
              >
                Silence for a Cycle
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
