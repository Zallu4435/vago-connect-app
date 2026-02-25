import Avatar from "../common/Avatar";
import { BsFillChatLeftTextFill } from "react-icons/bs";
import { IoSettingsOutline } from "react-icons/io5";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import dynamic from "next/dynamic";
import { getAbsoluteUrl } from "@/lib/url";
import LogoutOverlay from "@/components/common/LogoutOverlay";

const GroupCreateModal = dynamic(() => import("./GroupCreateModal"), { ssr: false });
const SidebarMenu = dynamic(() => import("./SidebarMenu"), { ssr: false });

function ChatListHeader() {
  const userInfo = useAuthStore((s) => s.userInfo);
  const setActivePage = useChatStore((s) => s.setActivePage);
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const [showSidebarMenu, setShowSidebarMenu] = useState(false);

  // Get the actual logout function and its loading state
  const { logout, isLoggingOut } = useAuth();

  const handleAllContactsPage = () => setActivePage("contacts");

  const handleLogout = async () => {
    setShowSidebarMenu(false);
    await logout();
  };

  return (
    <div className="
      h-14 sm:h-16 px-3 sm:px-5 py-2 sm:py-3
      flex items-center justify-between
      bg-ancient-bg-medium border-b border-ancient-border-stone shadow-md
      ">
      {/* Left: User Avatar */}
      <button className="focus:outline-none rounded-full overflow-hidden" type="button">
        <Avatar type="sm" image={getAbsoluteUrl(userInfo?.profileImage || userInfo?.image)} />
      </button>

      {/* Right: Main actions */}
      <div className="flex items-center gap-4 sm:gap-8">
        <BsFillChatLeftTextFill
          className="
            text-ancient-icon-inactive cursor-pointer
            text-lg sm:text-[22px]
            hover:text-ancient-icon-glow transition-colors duration-200
          "
          title="Start chat"
          onClick={handleAllContactsPage}
        />
        <button
          type="button"
          className="
            w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded
            hover:bg-ancient-input-bg transition
          "
          title="Settings"
          onClick={() => setShowSidebarMenu(true)}
        >
          <IoSettingsOutline className="text-ancient-icon-inactive text-lg sm:text-[22px] hover:text-ancient-icon-glow transition-colors duration-200" />
        </button>
      </div>

      <GroupCreateModal open={showGroupCreate} onClose={() => setShowGroupCreate(false)} />
      <SidebarMenu
        open={showSidebarMenu}
        onClose={() => setShowSidebarMenu(false)}
        user={userInfo}
        isLoggingOut={isLoggingOut}
        onNewGroup={() => { setShowSidebarMenu(false); setShowGroupCreate(true); }}
        onProfile={() => { setShowSidebarMenu(false); setActivePage("profile"); }}
        onCalls={() => { setShowSidebarMenu(false); setActivePage("calls"); }}
        onSettings={() => { setShowSidebarMenu(false); }}
        onLogout={handleLogout}
      />

      {/* Full-screen overlay during logout — no jarring page reload */}
      <LogoutOverlay visible={isLoggingOut} />
    </div>
  );
}

export default ChatListHeader;
