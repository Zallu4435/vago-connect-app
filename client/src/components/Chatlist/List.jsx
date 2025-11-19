import React, { useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useContacts } from "@/hooks/queries/useContacts";
import ChatListItem from "./ChatLIstItem";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";

function List() {
  const userInfo = useAuthStore((s) => s.userInfo);
  const contactsSearch = useChatStore((s) => s.contactsSearch);
  const { data: contacts = [], isLoading, error, refetch } = useContacts(userInfo?.id);

  const filteredContacts = useMemo(() => {
    const term = (contactsSearch || "").trim().toLowerCase();
    if (!term) return contacts;
    return (contacts || []).filter((c) => {
      const name = String(c?.name || c?.username || "").toLowerCase();
      const msg = String(c?.message || "").toLowerCase();
      return name.includes(term) || msg.includes(term);
    });
  }, [contacts, contactsSearch]);

  return (
    <div className="bg-bg-secondary flex-auto overflow-auto max-h-full custom-scrollbar">
      {isLoading ? (
        <LoadingSpinner label="Loading chats..." className="px-4 py-6 text-text-primary" />
      ) : error ? (
        <div className="px-4 py-6 flex items-center gap-3 text-text-primary">
          <ErrorMessage message="Failed to load chats" />
          <button
            type="button"
            className="bg-user-bubble hover:bg-other-bubble text-text-primary text-sm px-3 py-1 rounded transition-colors"
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      ) : contactsSearch && filteredContacts.length === 0 ? (
        <div className="text-text-secondary text-sm px-4 py-6">No chats found</div>
      ) : (
        (filteredContacts.length > 0 ? filteredContacts : contacts).map((contact) => (
          <ChatListItem data={contact} key={contact.id} />
        ))
      )}
    </div>
  );
}

export default List;
