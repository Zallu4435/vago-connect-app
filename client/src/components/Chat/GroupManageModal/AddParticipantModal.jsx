"use client";
import React, { useEffect, useMemo, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { FaFolderOpen, FaMagic } from "react-icons/fa";
import ModalShell from "@/components/common/ModalShell";
import ModalHeader from "@/components/common/ModalHeader";
import ContactSearchList from "@/components/common/ContactSearchList";

export default function AddParticipantModal({
  open,
  onClose,
  existingMembers,
  onAddMembers,
  isLoadingContacts,
  flatContacts,
  isAddingMembers,
}) {
  const [selectedAdd, setSelectedAdd] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedAdd([]);
      setSearchTerm("");
    }
  }, [open]);

  const availableContacts = useMemo(() => {
    const existingIds = new Set((existingMembers || []).map((m) => m.id));
    return (flatContacts || []).filter((c) => !existingIds.has(c.id));
  }, [flatContacts, existingMembers]);

  const toggleSelection = (uid) =>
    setSelectedAdd((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));

  const handleSubmit = () => {
    onAddMembers(selectedAdd);
  };

  return (
    <ModalShell open={open} onClose={onClose} maxWidth="max-w-lg">
      {/* Header */}
      <ModalHeader
        title="Entrust New Disciples"
        Icon={FaFolderOpen}
        onBack={onClose}
        centerTitle
      />

      <ContactSearchList
        contacts={availableContacts}
        loading={isLoadingContacts}
        selectedIds={selectedAdd}
        onToggle={toggleSelection}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search for spirits to entrust..."
        emptyText="No new spirits found for entrusting."
        wrapperClassName=""
        listClassName="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 max-h-[400px]"
      />

      {/* Footer */}
      <div className="flex justify-end p-4 bg-ancient-bg-medium border-t border-ancient-border-stone">
        <button
          onClick={handleSubmit}
          disabled={isAddingMembers || selectedAdd.length === 0}
          className="bg-ancient-icon-glow hover:bg-ancient-bubble-user-light text-ancient-bg-dark font-bold text-base px-6 py-2 rounded-lg shadow-md transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isAddingMembers ? "Entrusting..." : `Entrust (${selectedAdd.length})`} <FaMagic />
        </button>
      </div>
    </ModalShell>
  );
}
