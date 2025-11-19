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
    <div className="h-16 px-5 py-3 flex items-center justify-between bg-ancient-bg-medium border-b border-ancient-border-stone shadow-md">
      {/* Left: User Avatar, clickable */}
      <button className="focus:outline-none rounded-full overflow-hidden" type="button">
        <Avatar type="sm" image={userInfo?.profileImage} />
      </button>

      {/* Right: Main actions, spaced */}
      <div className="flex items-center gap-8">
        <BsFillChatLeftTextFill
          className="text-ancient-icon-inactive cursor-pointer text-[22px] hover:text-ancient-icon-glow transition-colors duration-200"
          title="Start Ancient Correspondence"
          onClick={handleAllContactsPage}
        />
        <div className="relative">
          <BsThreeDotsVertical
            className="text-ancient-icon-inactive cursor-pointer text-[22px] hover:text-ancient-icon-glow transition-colors duration-200"
            title="Ancient Menu"
            onClick={() => setShowMenu((v) => !v)}
          />
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-ancient-bg-dark border border-ancient-border-stone rounded-xl shadow-lg p-2 z-30 animate-fade-in-down origin-top-right">
              <button
                className="w-full text-left px-4 py-3 hover:bg-ancient-bubble-user text-ancient-text-light text-base rounded-md transition-colors"
                onClick={() => {
                  setShowGroupCreate(true);
                  setShowMenu(false);
                }}
              >
                Summon New Circle
              </button>
              {/* More menu items can be added here */}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal for creating group */}
      <GroupCreateModal open={showGroupCreate} onClose={() => setShowGroupCreate(false)} />
    </div>
  );
}

export default ChatListHeader;
