"use client";
import React, { useMemo, useState, useEffect } from "react";
import { useAllContacts } from "@/hooks/queries/useAllContacts";
import { useCreateGroup } from "@/hooks/mutations/useCreateGroup";
import { showToast } from "@/lib/toast";
import Image from "next/image";
import { IoArrowBack, IoClose } from "react-icons/io5";
import { FaMagic, FaScroll, FaFeather } from "react-icons/fa";
import ThemedInput from "@/components/common/ThemedInput";
import AvatarUpload from "@/components/common/AvatarUpload";
import ModalShell from "@/components/common/ModalShell";
import ContactSearchList from "@/components/common/ContactSearchList";
import ModalHeader from "@/components/common/ModalHeader";

export default function ForwardModal({ open, onClose }) {
  const { data: sections = {}, isLoading } = useAllContacts();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconFile, setIconFile] = useState(null);
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const createGroup = useCreateGroup();

  useEffect(() => {
    if (!open) {
      setStep(1);
      setName("");
      setDescription("");
      setIconFile(null);
      setSelected([]);
      setSearchTerm("");
    }
  }, [open]);

  const flatContacts = useMemo(() => {
    return Object.values(sections)
      .flat()
      .map((u) => ({ id: u.id, name: u.name, image: u.profileImage }));
  }, [sections]);

  const filteredContacts = useMemo(() => {
    if (!searchTerm) return flatContacts;
    return flatContacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(contact.id).includes(searchTerm)
    );
  }, [flatContacts, searchTerm]);

  const toggleContactSelection = (uid) =>
    setSelected((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
    );

  const canProceedToStep2 = selected.length > 0;
  const canFinalizeGroup = name.trim().length > 0 && selected.length > 0;

  const onSubmitGroup = () => {
    if (!canFinalizeGroup) return;
    const form = new FormData();
    form.append("groupName", name.trim());
    if (description.trim()) form.append("groupDescription", description.trim());
    if (iconFile) form.append("groupIcon", iconFile);
    selected.forEach((id) => form.append("memberIds", String(id)));

    createGroup.mutate(form, {
      onSuccess: () => {
        showToast.success("Group created successfully.");
        onClose?.();
      },
      onError: (error) => {
        showToast.error("Failed to create group. Please try again.");
        console.error("Group creation error:", error);
      },
    });
  };

  return (
    <ModalShell open={open} onClose={onClose} maxWidth="max-w-lg">
      {/* Step 1: Add Participants */}
      {step === 1 && (
        <div className="flex flex-col h-[55vh] sm:h-[65vh] animate-slide-in-right">
          <ModalHeader
            title="Select participants"
            Icon={FaMagic}
            onClose={onClose}
            centerTitle
          />

          <ContactSearchList
            contacts={flatContacts}
            loading={isLoading}
            selectedIds={selected}
            onToggle={toggleContactSelection}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search contacts..."
            emptyText="No contacts found."
            wrapperClassName="flex flex-col flex-grow"
            listClassName="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2"
          />

          {selected.length > 0 && (
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-ancient-input-bg border-b border-ancient-border-stone overflow-x-auto custom-scrollbar-horizontal">
              {selected.map((uid) => {
                const contact = flatContacts.find((c) => c.id === uid);
                if (!contact) return null;
                return (
                  <div
                    key={uid}
                    className="relative flex-shrink-0 flex flex-col items-center group cursor-pointer"
                    onClick={() => toggleContactSelection(uid)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        toggleContactSelection(uid);
                      }
                    }}
                    aria-label={`Remove ${contact.name} from selection`}
                  >
                    <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden border-2 border-ancient-icon-glow">
                      <Image
                        src={contact.image || "/default_avatar.png"}
                        alt={contact.name}
                        fill
                        className="object-cover"
                        priority
                      />
                      <div className="absolute inset-0 bg-red-700/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <IoClose className="text-white text-xl" />
                      </div>
                    </div>
                    <span className="text-ancient-text-light text-xs sm:text-sm mt-1 truncate max-w-[60px]">
                      {contact.name.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end p-3 sm:p-4 bg-ancient-bg-medium border-t border-ancient-border-stone">
            <button
              onClick={() => setStep(2)}
              disabled={!canProceedToStep2}
              className="bg-ancient-icon-glow hover:bg-ancient-bubble-user-light text-ancient-bg-dark font-bold text-base sm:text-lg px-5 py-2 rounded-lg shadow-md transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next ({selected.length}) <IoArrowBack className="rotate-180 h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Group Info */}
      {step === 2 && (
        <div className="flex flex-col h-[55vh] sm:h-[65vh] animate-slide-in-right">
          <ModalHeader
            title="Group details"
            Icon={FaScroll}
            onBack={() => setStep(1)}
          />

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6 flex flex-col items-center">
            <AvatarUpload iconFile={iconFile} setIconFile={setIconFile} name={name} />
            <div className="w-full max-w-xs sm:max-w-sm space-y-4">
              <ThemedInput
                name="Group name"
                state={name}
                setState={setName}
                placeholder="Enter a group name"
                Icon={FaScroll}
                label
              />
              <ThemedInput
                name="Description"
                state={description}
                setState={setDescription}
                placeholder="Add a description (optional)"
                Icon={FaFeather}
                label
              />
            </div>
          </div>

          <div className="flex justify-end p-3 sm:p-4 bg-ancient-bg-medium border-t border-ancient-border-stone">
            <button
              onClick={onSubmitGroup}
              disabled={!canFinalizeGroup || createGroup.isPending}
              className="bg-ancient-icon-glow hover:bg-ancient-bubble-user-light text-ancient-bg-dark font-bold text-base sm:text-lg px-6 py-2 rounded-lg shadow-md transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createGroup.isPending ? "Creating group..." : "Create group"}
              <FaMagic />
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
