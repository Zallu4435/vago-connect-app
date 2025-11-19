import Avatar from "../common/Avatar";
import { MdCall } from "react-icons/md";
import { IoVideocam } from "react-icons/io5";
import { BiSearchAlt2 } from "react-icons/bi";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";

function ChatHeader() {
  const [{ currentChatUser, userInfo, socket }, dispatch] = useStateProvider();

  const handleVoiceCall = () => {
    if (!currentChatUser || !userInfo) return;
    const call = {
      callType: "audio",
      from: { id: userInfo.id, name: userInfo.name, image: userInfo.profileImage },
      to: { id: currentChatUser.id, name: currentChatUser.name, image: currentChatUser.profilePicture || currentChatUser.image || currentChatUser.profileImage },
    };
    dispatch({ type: reducerCases.SET_CALL, call });
    dispatch({ type: reducerCases.SET_CALLING, calling: true });
    dispatch({ type: reducerCases.SET_AUDIO_CALL, audioCall: true });
    socket?.current?.emit?.("call-user", call);
  }

  const handleVideoCall = () => {
    if (!currentChatUser || !userInfo) return;
    const call = {
      callType: "video",
      from: { id: userInfo.id, name: userInfo.name, image: userInfo.profileImage },
      to: { id: currentChatUser.id, name: currentChatUser.name, image: currentChatUser.profilePicture || currentChatUser.image || currentChatUser.profileImage },
    };
    dispatch({ type: reducerCases.SET_CALL, call });
    dispatch({ type: reducerCases.SET_CALLING, calling: true });
    dispatch({ type: reducerCases.SET_VIDEO_CALL, videoCall: true });
    socket?.current?.emit?.("call-user", call);
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
          <span className="text-secondary text-sm">online/offline</span>
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
            console.log('header: search clicked');
            dispatch({ type: reducerCases.SET_MESSAGE_SEARCH, messageSearch: true });
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
