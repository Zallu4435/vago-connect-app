"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAllContacts } from "@/hooks/queries/useAllContacts";
import { useCreateGroup } from "@/hooks/mutations/useCreateGroup";
import { showToast } from "@/lib/toast";
import Image from "next/image";
import { IoArrowBack, IoClose } from "react-icons/io5";
import { FaMagic, FaScroll, FaFeather, FaUserCircle } from "react-icons/fa";

// Helper for image previews (if not using a dedicated Avatar component for this)
const GroupIconPreview = ({ iconFile, defaultImage, name }) => {
  const [preview, setPreview] = useState(defaultImage);

  useEffect(() => {
    if (iconFile) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(iconFile);
    } else {
      setPreview(defaultImage);
    }
  }, [iconFile, defaultImage]);

  return (
    <div className="relative h-28 w-28 rounded-full overflow-hidden border-2 border-ancient-icon-glow flex items-center justify-center bg-ancient-input-bg shadow-lg">
      <Image
        src={preview}
        alt={name || "Group Icon"}
        fill
        className="object-cover"
      />
      {!iconFile && <FaUserCircle className="absolute text-5xl text-ancient-text-muted opacity-70" />}
    </div>
  );
};

// --- New Themed Input Component (Reusing from Onboarding, but needs to be imported or inline) ---
const ThemedInput = ({ name, state, setState, label = false, placeholder, Icon }) => (
  <div className="flex flex-col gap-1 w-full relative">
    {label && (
      <label htmlFor={name} className="text-ancient-text-muted text-sm px-1 absolute -top-3 left-3 bg-ancient-bg-medium z-10 rounded-md">
        {name}
      </label>
    )}
    <div className="relative flex items-center gap-3 bg-ancient-input-bg border border-ancient-input-border rounded-lg px-4 py-3 focus-within:border-ancient-icon-glow transition-all duration-300 shadow-inner">
      {typeof Icon === 'function' ? <Icon className="text-ancient-icon-inactive text-xl" /> : null}
      <input
        type="text"
        id={name}
        placeholder={placeholder || `Enter your ${name.toLowerCase()}...`}
        className="flex-grow bg-transparent outline-none text-ancient-text-light placeholder:text-ancient-text-muted text-lg"
        value={state}
        onChange={(e) => setState(e.target.value)}
      />
    </div>
  </div>
);

// --- New Themed Avatar Upload Component (Inline for this example) ---
const ThemedAvatarUpload = ({ iconFile, setIconFile, name }) => {
  const [hover, setHover] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setIconFile(e.target.files?.[0] || null);
  };

  const openFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="relative cursor-pointer group"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={openFileInput}
    >
      <div
        className={`absolute inset-0 z-10 flex items-center justify-center flex-col text-center gap-1 rounded-full bg-ancient-bg-medium/80 backdrop-blur-sm border-2 border-ancient-icon-glow shadow-lg transition-opacity duration-300
          ${hover ? "opacity-100 visible" : "opacity-0 invisible"}`}
      >
        <FaScroll className="text-4xl text-ancient-icon-glow drop-shadow-md" />
        <span className="text-ancient-text-light text-sm font-bold z-20">
          Conjure <br /> Icon
        </span>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          hidden
        />
      </div>
      <GroupIconPreview iconFile={iconFile} defaultImage="/default_mystical_avatar.png" name={name} />
    </div>
  );
};

// --- Contact Selector Item (Inline) ---
const ContactSelectorItem = ({ contact, isSelected, onToggle }) => (
  <label className="flex items-center justify-between gap-3 px-4 py-2 rounded-lg hover:bg-ancient-bubble-user-light transition-colors duration-200 cursor-pointer border border-transparent has-checked:border-ancient-icon-glow">
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-10 rounded-full overflow-hidden bg-ancient-input-bg flex-shrink-0">
        <Image src={contact.image || "/default_mystical_avatar.png"} alt={contact.name} fill className="object-cover" />
      </div>
      <div className="flex flex-col">
        <span className="text-ancient-text-light text-base font-medium">{contact.name}</span>
        <span className="text-ancient-text-muted text-xs italic">Scroll Id: {contact.id}</span>
      </div>
    </div>
    <input
      type="checkbox"
      checked={isSelected}
      onChange={() => onToggle(contact.id)}
      className="h-5 w-5 rounded-full border-ancient-input-border bg-ancient-input-bg checked:bg-ancient-icon-glow checked:border-transparent focus:ring-ancient-icon-glow focus:ring-1 transition-colors duration-200"
    />
  </label>
);

export default function GroupCreateModal({ open, onClose }) {
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
      // Reset state when modal closes
      setStep(1);
      setName("");
      setDescription("");
      setIconFile(null);
      setSelected([]);
      setSearchTerm("");
    }
  }, [open]);

  const flatContacts = useMemo(() => {
    return Object.values(sections).flat().map((u) => ({ id: u.id, name: u.name, image: u.profileImage }));
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
    setSelected((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));

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
        showToast.success("Ancient conclave established!");
        onClose?.();
      },
      onError: (error) => {
        showToast.error("Failed to establish the conclave. The spirits are restless.");
        console.error("Group creation error:", error);
      },
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      {/* Modal Container */}
      <div className="relative bg-ancient-bg-dark rounded-xl w-full max-w-lg shadow-2xl border border-ancient-border-stone animate-zoom-in overflow-hidden">
        {/* Step 1: Add Participants */}
        {step === 1 && (
          <div className="flex flex-col h-[600px] sm:h-[700px] animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-ancient-bg-medium border-b border-ancient-border-stone">
              <button
                onClick={onClose}
                className="text-ancient-text-muted hover:text-red-400 transition-colors duration-200"
                aria-label="Close"
              >
                <IoClose className="h-7 w-7" />
              </button>
              <h3 className="text-ancient-text-light text-xl font-bold flex items-center gap-2">
                <FaMagic className="text-ancient-icon-glow" /> Select Conclave Members
              </h3>
              <div className="w-7"></div> {/* Placeholder for alignment */}
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-ancient-border-stone bg-ancient-input-bg">
              <ThemedInput
                name="Search Contacts"
                state={searchTerm}
                setState={setSearchTerm}
                placeholder="Search for spirits..."
                Icon={FaMagic}
              />
            </div>

            {/* Selected Contacts Preview (horizontal scroll) */}
            {selected.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-ancient-input-bg border-b border-ancient-border-stone overflow-x-auto custom-scrollbar-horizontal">
                {selected.map((uid) => {
                  const contact = flatContacts.find((c) => c.id === uid);
                  if (!contact) return null;
                  return (
                    <div key={uid} className="relative flex-shrink-0 flex flex-col items-center group cursor-pointer" onClick={() => toggleContactSelection(uid)}>
                      <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-ancient-icon-glow">
                        <Image src={contact.image || "/default_mystical_avatar.png"} alt={contact.name} fill className="object-cover" />
                        <div className="absolute inset-0 bg-red-700/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <IoClose className="text-white text-xl" />
                        </div>
                      </div>
                      <span className="text-ancient-text-light text-xs mt-1 truncate max-w-[50px]">{contact.name.split(" ")[0]}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
              {isLoading && (
                <div className="text-ancient-text-muted text-center py-8">
                  Summoning spirits from the ethereal plane...
                </div>
              )}
              {!isLoading && filteredContacts.length === 0 && (
                <div className="text-ancient-text-muted text-center py-8">
                  No spirits found matching your incantation.
                </div>
              )}
              {!isLoading && filteredContacts.map((contact) => (
                <ContactSelectorItem
                  key={contact.id}
                  contact={contact}
                  isSelected={selected.includes(contact.id)}
                  onToggle={toggleContactSelection}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="flex justify-end p-4 bg-ancient-bg-medium border-t border-ancient-border-stone">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="bg-ancient-icon-glow hover:bg-ancient-bubble-user-light text-ancient-bg-dark font-bold text-base px-6 py-2 rounded-lg shadow-md transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next Ritual ({selected.length}) <IoArrowBack className="rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Group Info */}
        {step === 2 && (
          <div className="flex flex-col h-[600px] sm:h-[700px] animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center p-4 bg-ancient-bg-medium border-b border-ancient-border-stone">
              <button
                onClick={() => setStep(1)}
                className="text-ancient-text-muted hover:text-ancient-icon-glow transition-colors duration-200 mr-4"
                aria-label="Back"
              >
                <IoArrowBack className="h-7 w-7" />
              </button>
              <h3 className="text-ancient-text-light text-xl font-bold flex items-center gap-2">
                <FaScroll className="text-ancient-icon-glow" /> Inscribe Conclave Details
              </h3>
            </div>

            {/* Group Info Form */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 flex flex-col items-center">
              <ThemedAvatarUpload iconFile={iconFile} setIconFile={setIconFile} name={name} />
              <div className="w-full max-w-sm space-y-4">
                <ThemedInput
                  name="Conclave Name"
                  state={name}
                  setState={setName}
                  placeholder="E.g., Whispering Circle, Council of Elders"
                  Icon={FaScroll}
                  label
                />
                <ThemedInput
                  name="Conclave Purpose"
                  state={description}
                  setState={setDescription}
                  placeholder="Share the purpose of your gathering..."
                  Icon={FaFeather}
                  label
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-4 bg-ancient-bg-medium border-t border-ancient-border-stone">
              <button
                onClick={onSubmitGroup}
                disabled={!canFinalizeGroup || createGroup.isPending}
                className="bg-ancient-icon-glow hover:bg-ancient-bubble-user-light text-ancient-bg-dark font-bold text-base px-6 py-2 rounded-lg shadow-md transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createGroup.isPending ? "Forging Conclave..." : "Forge Conclave"} <FaMagic />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}