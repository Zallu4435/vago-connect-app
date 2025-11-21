import React, { useMemo, useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useContactsPaginated } from "@/hooks/queries/useContactsPaginated";
import ChatListItem from "./ChatLIstItem";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";

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

  const sentinelRef = useRef(null);

  const contacts = useMemo(() => {
    const pages = data?.pages || [];
    const flat = pages.flatMap((p) => p.contacts || []);
    const sorted = flat.slice().sort((a, b) => {
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

  useEffect(() => {
    if (!hasNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting) {
        fetchNextPage();
      }
    });
    obs.observe(el);
    return () => {
      obs.disconnect();
    };
  }, [hasNextPage, fetchNextPage, data]);

  let content = null;

  if (isLoading) {
    content = (
      <div className="w-full py-8 flex justify-center items-center">
        <LoadingSpinner label="Decoding ancient messages..." className="text-ancient-text-muted" />
      </div>
    );
  } else if (error) {
    content = (
      <div className="mx-4 my-6 px-5 py-6 flex flex-col gap-4 rounded-xl shadow-xl bg-ancient-warning-bg text-ancient-text-light">
        <ErrorMessage message="Failed to retrieve ancient archives." />
        <button
          type="button"
          className="self-start bg-ancient-bubble-user hover:bg-ancient-bubble-user-light text-ancient-text-light text-sm px-4 py-2 rounded shadow-md transition-colors"
          onClick={() => refetch()}
        >
          Re-read the Runes
        </button>
      </div>
    );
  } else if (contactsSearch && filteredContacts.length === 0) {
    content = (
      <div className="w-full py-8 text-center text-base text-ancient-text-muted">
        No matching echoes found.
      </div>
    );
  } else {
    const list = filteredContacts.length > 0 ? filteredContacts : contacts;
    content = (
      <ul className="space-y-0">
        {list.map((contact) => (
          <li key={contact.id}>
            <ChatListItem data={contact} />
          </li>
        ))}
        {hasNextPage && (
          <li ref={sentinelRef}>
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
    <div className="bg-ancient-bg-dark flex-auto overflow-auto max-h-full custom-scrollbar border-r border-ancient-border-stone">
      {content}
    </div>
  );
}

export default List;
