import Avatar from "../common/Avatar";
import { BsFillChatLeftTextFill, BsThreeDotsVertical } from "react-icons/bs";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useState } from "react";
import GroupCreateModal from "./GroupCreateModal";

function ChatListHeader() {
  const userInfo = useAuthStore((s) => s.userInfo);
  const setAllContactsPage = useChatStore((s) => s.setAllContactsPage);
  const [showMenu, setShowMenu] = useState(false);
  const [showGroupCreate, setShowGroupCreate] = useState(false);

  const handleAllContactsPage = () => {
    setAllContactsPage(true);
  };

  return (
    <div className="h-16 px-4 py-3 flex justify-between items-center bg-bg-main border-b border-conversation-border">
      <div className="cursor-pointer">
        <Avatar type="sm" image={userInfo?.profileImage} />
      </div>
      <div className="flex gap-6">
        <BsFillChatLeftTextFill
          className="text-icon-active cursor-pointer text-xl"
          title="New Chat"
          onClick={handleAllContactsPage}
        />
        <div className="relative">
          <BsThreeDotsVertical
            className="text-icon-active cursor-pointer text-xl"
            title="Menu"
            onClick={() => setShowMenu((v) => !v)}
          />
          {showMenu && (
            <div className="absolute right-0 mt-2 z-20 w-48 bg-bg-secondary border border-[#2a3942] rounded-md shadow-lg p-1">
              <button
                className="w-full text-left px-3 py-2 hover:bg-user-bubble text-text-primary text-sm rounded"
                onClick={() => {
                  setShowGroupCreate(true);
                  setShowMenu(false);
                }}
              >
                New Group
              </button>
            </div>
          )}
        </div>
      </div>
      <GroupCreateModal open={showGroupCreate} onClose={() => setShowGroupCreate(false)} />
    </div>
  );
}

export default ChatListHeader;
