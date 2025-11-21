import Avatar from "../common/Avatar";
import { BsFillChatLeftTextFill } from "react-icons/bs";
import { IoSettingsOutline, IoPersonCircleOutline, IoPeopleOutline, IoCallOutline, IoLogOutOutline } from "react-icons/io5";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useState } from "react";
import GroupCreateModal from "./GroupCreateModal";
import ActionSheet from "@/components/common/ActionSheet";
import { getAbsoluteUrl } from "@/lib/url";
import ModalShell from "@/components/common/ModalShell";
import ModalHeader from "@/components/common/ModalHeader";
import SidebarMenu from "./SidebarMenu";

function ChatListHeader() {
  const userInfo = useAuthStore((s) => s.userInfo);
  const setAllContactsPage = useChatStore((s) => s.setAllContactsPage);
  const [showMenu, setShowMenu] = useState(false);
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebarMenu, setShowSidebarMenu] = useState(false);

  const handleAllContactsPage = () => {
    setAllContactsPage(true);
  };

  return (
    <div className="h-16 px-5 py-3 flex items-center justify-between bg-ancient-bg-medium border-b border-ancient-border-stone shadow-md">
      {/* Left: User Avatar, clickable */}
      <button className="focus:outline-none rounded-full overflow-hidden" type="button">
        <Avatar type="sm" image={getAbsoluteUrl(userInfo?.profileImage || userInfo?.image)} />
      </button>

      {/* Right: Main actions, spaced */}
      <div className="flex items-center gap-8">
        <BsFillChatLeftTextFill
          className="text-ancient-icon-inactive cursor-pointer text-[22px] hover:text-ancient-icon-glow transition-colors duration-200"
          title="Start chat"
          onClick={handleAllContactsPage}
        />
        <button
          type="button"
          className="w-9 h-9 flex items-center justify-center rounded hover:bg-ancient-input-bg"
          title="Settings"
          onClick={() => setShowSidebarMenu(true)}
        >
          <IoSettingsOutline className="text-ancient-icon-inactive text-[22px] hover:text-ancient-icon-glow transition-colors duration-200" />
        </button>
      </div>
      
      {/* Modal for creating group */}
      <GroupCreateModal open={showGroupCreate} onClose={() => setShowGroupCreate(false)} />

      {/* Sidebar menu overlay (Telegram-like) */}
      <SidebarMenu
        open={showSidebarMenu}
        onClose={() => setShowSidebarMenu(false)}
        user={userInfo}
        onNewGroup={() => { setShowSidebarMenu(false); setShowGroupCreate(true); }}
        onProfile={() => { /* route to profile */ setShowSidebarMenu(false); }}
        onCalls={() => { /* open calls */ setShowSidebarMenu(false); }}
        onSettings={() => { /* open settings */ setShowSidebarMenu(false); }}
        onLogout={() => { /* logout */ setShowSidebarMenu(false); }}
      />
    </div>
  );
}

export default ChatListHeader;
