import React from "react";
import Avatar from "../common/Avatar";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "../common/MessageStatus";

function ChatListItem({ data, isContactsPage = false }) {
  const [{ userInfo, currentChatUser }, dispatch] = useStateProvider();
  const handleContactClick = () => {
    // if (currentChatUser?.id === data?.id) {
        dispatch({type: reducerCases.SET_CURRENT_CHAT_USER, payload: data});
        dispatch({type: reducerCases.SET_ALL_CONTACTS_PAGE, allContactsPage: false});
    // }
  };

  const isSenderLast = data?.senderId === userInfo?.id;
  const lastTime = data?.timestamp ? calculateTime(data.timestamp) : "";
  let preview = "";
  if (data?.type === "image") preview = "Photo";
  else if (data?.type === "audio") preview = "Voice message";
  else preview = data?.message || "\u00A0";

  return (
    <div className="flex cursor-pointer items-center hover:bg-background-default-hover" onClick={handleContactClick}>
      <div className="min-w-fit px-5 pt-3 pb-1">
        <Avatar
          type="lg"
          image={data?.profilePicture || data?.image || data?.profileImage}
        />
      </div>
      <div className="min-h-full flex flex-col justify-center mt-3 pr-2 w-full">
        <div className="flex justify-between items-center">
          <span className="text-white">{data?.name}</span>
          <span className="text-secondary text-xs">{lastTime}</span>
        </div>
        <div className="flex border-b border-conversation-border pb-2 pt-1 pr-2">
          <div className="flex justify-between w-full items-center gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {isSenderLast && (
                <span className="text-secondary">
                  <MessageStatus MessageStatus={data?.messageStatus} />
                </span>
              )}
              <span className="text-secondary line-clamp-1 text-sm break-all">
                {preview}
              </span>
            </div>
            {data?.totalUnreadMessages > 0 && (
              <span className="ml-2 min-w-[20px] h-5 px-1 rounded-full bg-[#25d366] text-[#111b21] text-xs font-semibold flex items-center justify-center">
                {data.totalUnreadMessages}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatListItem;
