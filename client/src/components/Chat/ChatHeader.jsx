import Avatar from "../common/Avatar";
import { MdCall } from "react-icons/md";
import { IoVideocam } from "react-icons/io5";
import { BiSearchAlt2 } from "react-icons/bi";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useCallStore } from "@/stores/callStore";
import { useSocketStore } from "@/stores/socketStore";
import { showToast } from "@/lib/toast";
import { useRef } from "react";

function ChatHeader() {
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const userInfo = useAuthStore((s) => s.userInfo);
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const socket = useSocketStore((s) => s.socket);
  const initiateCall = useCallStore((s) => s.initiateCall);
  const callToastIdRef = useRef(null);

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
        <BsThreeDotsVertical
          className="text-panel-header-icon cursor-pointer text-xl"
          onClick={() => console.log('header: menu clicked')}
        />
      </div>
    </div>
  );
}

export default ChatHeader;
