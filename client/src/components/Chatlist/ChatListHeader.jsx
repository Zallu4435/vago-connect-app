import Avatar from "../common/Avatar";
import { BsFillChatLeftTextFill, BsThreeDotsVertical } from "react-icons/bs";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";

function ChatListHeader() {
  const userInfo = useAuthStore((s) => s.userInfo);
  const setAllContactsPage = useChatStore((s) => s.setAllContactsPage);

  const handleAllContactsPage = () => {
    setAllContactsPage(true);
  };

  return (
    <div className="h-16 px-4 py-3 flex justify-between items-center bg-panel-header-background border-b border-conversation-border">
      <div className="cursor-pointer">
        <Avatar type="sm" image={userInfo?.profileImage} />
      </div>
      <div className="flex gap-6">
        <BsFillChatLeftTextFill
          className="text-panel-header-icon cursor-pointer text-xl"
          title="New Chat"
          onClick={handleAllContactsPage}
        />
        <>
          <BsThreeDotsVertical
            className="text-panel-header-icon cursor-pointer text-xl"
            title="Menu"
          />
        </>
      </div>
    </div>
  );
}

export default ChatListHeader;
