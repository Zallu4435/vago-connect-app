"use client";
import React, { useMemo } from "react";
import ThemedInput from "@/components/common/ThemedInput";
import ContactSelectorItem from "@/components/common/ContactSelectorItem";
import { FaMagic } from "react-icons/fa";

export default function ContactSearchList({
  contacts = [],
  loading = false,
  selectedIds = [],
  onToggle,
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  wrapperClassName = "",
  listClassName = "",
}) {
  const filtered = useMemo(() => {
    if (!searchTerm) return contacts;
    const q = String(searchTerm).toLowerCase();
    return contacts.filter(
      (c) => c?.name?.toLowerCase()?.includes(q) || String(c?.id).includes(q)
    );
  }, [contacts, searchTerm]);

  return (
    <div className={wrapperClassName}>
      <div className="p-4 border-b border-ancient-border-stone bg-ancient-input-bg">
        <ThemedInput
          name="Search Contacts"
          state={searchTerm}
          setState={onSearchChange}
          placeholder={searchPlaceholder}
          Icon={FaMagic}
        />
      </div>

      <div className={listClassName}>
        {loading && (
          <div className="text-ancient-text-muted text-center py-8">
            Summoning spirits from the ethereal plane...
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-ancient-text-muted text-center py-8">{emptyText}</div>
        )}
        {!loading && filtered.map((contact) => (
          <ContactSelectorItem
            key={contact.id}
            contact={contact}
            isSelected={selectedIds.includes(contact.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}
