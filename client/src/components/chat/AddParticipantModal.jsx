"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaFolderOpen, FaMagic } from "react-icons/fa";
import { useAllContactsPaginated } from '@/hooks/contacts/useAllContactsPaginated';
import ModalShell from "@/components/common/ModalShell";
import ModalHeader from "@/components/common/ModalHeader";
import ContactSearchList from "@/components/common/ContactSearchList";
import { useInfiniteScroll } from "@/hooks/ui/useInfiniteScroll";
import { useDebounce } from "@/hooks/ui/useDebounce";

export default function AddParticipantModal({
  open,
  onClose,
  existingMembers,
  onAddMembers,
  isAddingMembers,
}) {
  const [selectedAdd, setSelectedAdd] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // 300ms debounced search sent to the backend
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Infinite query with backend search + pagination
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useAllContactsPaginated({
    q: debouncedSearch,
    limit: 30,
    sort: "name_asc",
  });

  // Reset selections and search when modal closes/opens
  useEffect(() => {
    if (!open) {
      setSelectedAdd([]);
      setSearchTerm("");
    }
  }, [open]);

  // Flatten all pages and exclude already-existing members
  const availableContacts = useMemo(() => {
    const existingIds = new Set((existingMembers || []).map((m) => String(m.id)));
    const allUsers = (data?.pages ?? []).flatMap((page) =>
      Object.values(page.sections ?? {}).flat()
    );
    return allUsers.filter((u) => !existingIds.has(String(u.id)));
  }, [data, existingMembers]);

  // Infinite scroll: observe sentinel element
  const loadMoreRef = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    fetchNextPage,
    rootMargin: "100px", // equivalent to threshold: 0.1 approximately
  });

  const toggleSelection = useCallback(
    (uid) => {
      setSelectedAdd((prev) => {
        if (prev.includes(uid)) return prev.filter((x) => x !== uid);
        const activeCount = (existingMembers?.length || 0);
        const totalAllowed = 20 - activeCount;
        if (prev.length >= totalAllowed) {
          import("@/lib/toast").then((m) =>
            m.showToast.error(
              `You can only add ${totalAllowed} more member(s) to reach the 20-member limit.`
            )
          );
          return prev;
        }
        return [...prev, uid];
      });
    },
    [existingMembers]
  );

  const handleSubmit = () => {
    if (selectedAdd.length > 0) onAddMembers(selectedAdd);
  };

  return (
    <ModalShell open={open} onClose={onClose} maxWidth="max-w-lg">
      {/* Header */}
      <ModalHeader
        title="Add Participants"
        Icon={FaFolderOpen}
        onBack={onClose}
        centerTitle
      />

      {/* Contact list with debounced search */}
      <ContactSearchList
        contacts={availableContacts}
        loading={isLoading}
        selectedIds={selectedAdd}
        onToggle={toggleSelection}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search contacts..."
        emptyText={
          debouncedSearch
            ? `No contacts found for "${debouncedSearch}".`
            : "No contacts available to add."
        }
        wrapperClassName=""
        listClassName="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 max-h-[400px]"
      />

      {/* Infinite scroll sentinel */}
      <div ref={loadMoreRef} className="h-4 flex items-center justify-center">
        {isFetchingNextPage && (
          <span className="text-ancient-text-muted text-xs">Loading more...</span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 bg-ancient-bg-medium border-t border-ancient-border-stone">
        <span className="text-ancient-text-muted text-sm">
          {selectedAdd.length > 0
            ? `${selectedAdd.length} selected`
            : "Select members to add"}
        </span>
        <button
          onClick={handleSubmit}
          disabled={isAddingMembers || selectedAdd.length === 0}
          className="bg-ancient-icon-glow hover:bg-ancient-bubble-user-light text-ancient-bg-dark font-bold text-base px-6 py-2 rounded-lg shadow-md transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isAddingMembers ? "Adding..." : `Add (${selectedAdd.length})`} <FaMagic />
        </button>
      </div>
    </ModalShell>
  );
}
