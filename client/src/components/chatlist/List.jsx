import React, { useMemo, useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useContactsPaginated } from '@/hooks/contacts/useContactsPaginated';
import ChatListItem from "./ChatLIstItem";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import EmptyState from "@/components/common/EmptyState";
import Button from "@/components/common/Button";
import { useInfiniteScroll } from "@/hooks/ui/useInfiniteScroll";

function List() {
  const userInfo = useAuthStore((s) => s.userInfo);
  const contactsSearch = useChatStore((s) => s.contactsSearch);
  const {
    data,
    isFetching,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error,
    refetch,
    fetchNextPage,
  } = useContactsPaginated(userInfo?.id, { limit: 30, q: (contactsSearch || '').trim() });

  const sentinelRef = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    fetchNextPage,
  });

  const contacts = useMemo(() => {
    const pages = data?.pages || [];
    const flat = pages.flatMap((p) => p.contacts || []);
    const sorted = flat.slice().sort((a, b) => {
      if (a.isSelf && !b.isSelf) return -1;
      if (!a.isSelf && b.isSelf) return 1;

      if (a.isPinned && b.isPinned) return (a.pinOrder ?? 0) - (b.pinOrder ?? 0);
      if (a.isPinned) return -1;
      if (b.isPinned) return 1;
      const ta = new Date(a.timestamp || 0).getTime();
      const tb = new Date(b.timestamp || 0).getTime();
      return tb - ta;
    });
    return sorted;
  }, [data]);

  const filteredContacts = useMemo(() => {
    const term = (contactsSearch || "").trim().toLowerCase();
    if (!term) return contacts;
    return (contacts || []).filter((c) => {
      const name = String(c?.name || c?.username || "").toLowerCase();
      const msg = String(c?.message || "").toLowerCase();
      return name.includes(term) || msg.includes(term);
    });
  }, [contacts, contactsSearch]);

  let content = null;

  if (isLoading) {
    content = (
      <div key="loading-chats" className="w-full py-8 flex justify-center items-center">
        <LoadingSpinner label="Loading chats..." className="text-ancient-text-muted" />
      </div>
    );
  } else if (error) {
    content = (
      <div key="error-chats" className="flex flex-col items-center justify-center p-6 gap-4 mt-4">
        <ErrorMessage message="Failed to load chats." />
        <Button
          onClick={() => refetch()}
          variant="secondary"
          className="mt-2 shadow-md"
        >
          Retry
        </Button>
      </div>
    );
  } else if (contactsSearch && filteredContacts.length === 0) {
    content = (
      <div key="no-results-chats" className="w-full py-8">
        <EmptyState title="No results found." layout="embedded" />
      </div>
    );
  } else {
    const list = filteredContacts.length > 0 ? filteredContacts : contacts;
    content = (
      <ul key="chat-list" className="space-y-0">
        {list.map((contact) => (
          <li key={contact.id}>
            <ChatListItem data={contact} />
          </li>
        ))}
        {hasNextPage && (
          <li key="sentinel" ref={sentinelRef}>
            {isFetchingNextPage ? (
              <div className="w-full py-4 flex justify-center items-center">
                <LoadingSpinner className="text-ancient-text-muted" />
              </div>
            ) : (
              <div className="py-2" />
            )}
          </li>
        )}
      </ul>
    );
  }

  return (
    <div className="
      bg-ancient-bg-dark flex-auto overflow-auto max-h-full custom-scrollbar border-r border-ancient-border-stone
      w-full h-full min-w-0
    ">
      {content}
    </div>
  );
}

export default List;
