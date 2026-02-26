import React, { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useAllContacts } from '@/hooks/contacts/useAllContacts';
import { useCreateGroup } from '@/hooks/groups/useCreateGroup';
import { showToast } from "@/lib/toast";
import Image from "next/image";
import { IoArrowBack, IoClose } from "react-icons/io5";
import { FaMagic, FaScroll, FaFeather } from "react-icons/fa";
import ThemedInput from "@/components/common/ThemedInput";
import AvatarUpload from "@/components/common/AvatarUpload";
import ContactSelectorItem from "@/components/common/ContactSelectorItem";
import ModalShell from "@/components/common/ModalShell";
import Button from "@/components/common/Button";

export default function GroupCreateModal({ open, onClose }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const { data: sections = {}, isLoading } = useAllContacts();
  const [step, setStep] = useState(1); // 1: Select participants, 2: Group info
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
      .filter((u) => String(u.id) !== String(userInfo?.id))
      .map((u) => ({
        id: u.id,
        name: u.name,
        about: u.about,
        image: u.profileImage,
      }));
  }, [sections, userInfo]);

  const filteredContacts = useMemo(() => {
    if (!searchTerm) return flatContacts;
    return flatContacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(contact.id).includes(searchTerm)
    );
  }, [flatContacts, searchTerm]);

  const toggleContactSelection = (uid) => {
    setSelected((prev) => {
      if (prev.includes(uid)) return prev.filter((x) => x !== uid);
      if (prev.length >= 19) {
        showToast.error("Group limit reached (max 20 members including you).");
        return prev;
      }
      return [...prev, uid];
    });
  };

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
        showToast.success("Group created");
        onClose?.();
      },
      onError: (error) => {
        showToast.error("Failed to create group. Please try again.");
        console.error("Group creation error:", error);
      },
    });
  };

  if (!open) return null;

  return (
    <ModalShell open={open} onClose={onClose} maxWidth="max-w-lg">
      {/* Step 1: Add Participants */}
      {step === 1 && (
        <div className="flex flex-col h-[60vh] sm:h-[70vh] animate-slide-in-right">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 bg-ancient-bg-medium border-b border-ancient-border-stone">
            <button
              onClick={onClose}
              className="text-ancient-text-muted hover:text-red-400 transition-colors duration-200"
              aria-label="Close"
            >
              <IoClose className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
            <h3 className="text-ancient-text-light text-lg sm:text-xl font-bold flex items-center gap-2">
              <FaMagic className="text-ancient-icon-glow" /> Add participants
            </h3>
            <div className="w-6 sm:w-7" /> {/* Alignment placeholder */}
          </div>

          {/* Search Input */}
          <div className="p-2 sm:p-4 border-b border-ancient-border-stone bg-ancient-input-bg">
            <ThemedInput
              name="Search Contacts"
              state={searchTerm}
              setState={setSearchTerm}
              placeholder="Search contacts"
              Icon={FaMagic}
            />
          </div>

          {/* Selected Contacts Preview (horizontal scroll) */}
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
                  >
                    <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-ancient-icon-glow">
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
                    <span className="text-ancient-text-light text-xs mt-1 truncate max-w-[56px] sm:max-w-[72px]">
                      {contact.name.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-2">
            {isLoading && (
              <div className="text-ancient-text-muted text-center py-8 text-base sm:text-lg">
                Loading contacts...
              </div>
            )}
            {!isLoading && filteredContacts.length === 0 && (
              <div className="text-ancient-text-muted text-center py-8 text-base sm:text-lg">
                No contacts found.
              </div>
            )}
            {!isLoading &&
              filteredContacts.map((contact) => (
                <ContactSelectorItem
                  key={contact.id}
                  contact={contact}
                  isSelected={selected.includes(contact.id)}
                  onToggle={toggleContactSelection}
                />
              ))}
          </div>

          <div className="flex justify-end p-3 sm:p-4 bg-ancient-bg-medium border-t border-ancient-border-stone">
            <Button
              onClick={() => setStep(2)}
              disabled={!canProceedToStep2}
              className="px-5 shadow-md transform hover:scale-105"
            >
              Next ({selected.length}){" "}
              <IoArrowBack className="rotate-180 h-5 w-5 sm:h-6 sm:w-6 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Group Details */}
      {step === 2 && (
        <div className="flex flex-col h-[60vh] sm:h-[70vh] animate-slide-in-right">
          <div className="flex items-center p-3 sm:p-4 bg-ancient-bg-medium border-b border-ancient-border-stone">
            <button
              onClick={() => setStep(1)}
              className="text-ancient-text-muted hover:text-ancient-icon-glow transition-colors duration-200 mr-4"
              aria-label="Back"
            >
              <IoArrowBack className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
            <h3 className="text-ancient-text-light text-lg sm:text-xl font-bold flex items-center gap-2">
              <FaScroll className="text-ancient-icon-glow" /> Group details
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6 flex flex-col items-center">
            <AvatarUpload iconFile={iconFile} setIconFile={setIconFile} name={name} />
            <div className="w-full max-w-xs sm:max-w-sm space-y-4">
              <ThemedInput
                name="Group name"
                state={name}
                setState={setName}
                placeholder="Enter group name"
                Icon={FaScroll}
                label
              />
              <ThemedInput
                name="Description"
                state={description}
                setState={setDescription}
                placeholder="Add an optional description"
                Icon={FaFeather}
                label
              />
            </div>
          </div>

          <div className="flex justify-end p-3 sm:p-4 bg-ancient-bg-medium border-t border-ancient-border-stone">
            <Button
              onClick={onSubmitGroup}
              disabled={!canFinalizeGroup}
              isLoading={createGroup.isPending}
              loadingText="Creating..."
              className="px-6 shadow-md transform hover:scale-105"
            >
              Create group <FaMagic className="ml-2" />
            </Button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
