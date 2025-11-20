"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useAllContacts } from "@/hooks/queries/useAllContacts";
import { useUpdateGroupSettings } from "@/hooks/mutations/useUpdateGroupSettings";
import { useAddGroupMembers, useRemoveGroupMembers } from "@/hooks/mutations/useGroupMembers";
import { useUpdateGroupRole } from "@/hooks/mutations/useUpdateGroupRole";
import { useLeaveGroup, useDeleteGroup } from "@/hooks/mutations/useGroupActions";
import { showToast } from "@/lib/toast";
import Image from "next/image";
import { IoArrowBack, IoClose, IoAdd, IoRemove, IoTrash, IoExitOutline, IoChevronForward } from "react-icons/io5";
import { FaMagic, FaScroll, FaFeather, FaUserCircle, FaFolderOpen, FaTabletAlt, FaUsers, FaLock, FaFire, FaShieldAlt } from "react-icons/fa";

// Re-using GroupIconPreview from GroupCreateModal
const GroupIconPreview = ({ iconFile, defaultImage, name, currentIconUrl }) => {
  const [preview, setPreview] = useState(defaultImage);

  useEffect(() => {
    if (iconFile) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(iconFile);
    } else {
      setPreview(currentIconUrl || defaultImage); // Use currentIconUrl if no new file
    }
  }, [iconFile, defaultImage, currentIconUrl]);

  return (
    <div className="relative h-28 w-28 rounded-full overflow-hidden border-2 border-ancient-icon-glow flex items-center justify-center bg-ancient-input-bg shadow-lg">
      <Image
        src={preview}
        alt={name || "Group Icon"}
        fill
        className="object-cover"
      />
      {!iconFile && !currentIconUrl && <FaUserCircle className="absolute text-5xl text-ancient-text-muted opacity-70" />}
    </div>
  );
};

// Re-using ThemedInput from GroupCreateModal
const ThemedInput = ({ name, state, setState, label = false, placeholder, Icon, isEditable = true }) => (
  <div className="flex flex-col gap-1 w-full relative">
    {label && (
      <label htmlFor={name} className="text-ancient-text-muted text-sm px-1 absolute -top-3 left-3 bg-ancient-bg-dark z-10 rounded-md">
        {name}
      </label>
    )}
    <div className={`relative flex items-center gap-3 bg-ancient-input-bg border rounded-lg px-4 py-3 shadow-inner
      ${isEditable ? 'focus-within:border-ancient-icon-glow border-ancient-input-border' : 'border-transparent cursor-default'}`}>
      {typeof Icon === 'function' ? <Icon className="text-ancient-icon-inactive text-xl" /> : null}
      <input
        type="text"
        id={name}
        placeholder={placeholder || `Enter ${name.toLowerCase()}...`}
        className={`flex-grow bg-transparent outline-none text-ancient-text-light placeholder:text-ancient-text-muted text-lg
          ${!isEditable && 'pointer-events-none'}`}
        value={state}
        onChange={(e) => isEditable && setState(e.target.value)}
        disabled={!isEditable}
      />
    </div>
  </div>
);

// Re-using ThemedAvatarUpload from GroupCreateModal (adapted to take existing URL)
const ThemedAvatarUpload = ({ iconFile, setIconFile, name, currentIconUrl, isEditable = true }) => {
  const [hover, setHover] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setIconFile(e.target.files?.[0] || null);
  };

  const openFileInput = () => {
    if (isEditable) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      className={`relative ${isEditable ? 'cursor-pointer group' : 'cursor-default'}`}
      onMouseEnter={() => isEditable && setHover(true)}
      onMouseLeave={() => isEditable && setHover(false)}
      onClick={openFileInput}
    >
      {isEditable && (
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
      )}
      <GroupIconPreview iconFile={iconFile} defaultImage="/default_mystical_avatar.png" name={name} currentIconUrl={currentIconUrl} />
    </div>
  );
};

// New Themed Switch Component (for simple toggles like ephemeral messages)
const ThemedSwitch = ({ label, checked, onChange, isEditable = true }) => (
  <label className={`flex items-center justify-between p-4 bg-ancient-input-bg rounded-lg border border-ancient-input-border shadow-inner
    ${isEditable ? 'cursor-pointer hover:bg-ancient-bubble-user-light' : 'cursor-default opacity-70'} transition-all duration-200`}>
    <span className="text-ancient-text-light text-lg">{label}</span>
    <div className={`relative w-12 h-6 rounded-full transition-colors duration-200
      ${checked ? 'bg-ancient-icon-glow' : 'bg-ancient-border-stone'}`}>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
        disabled={!isEditable}
      />
      <div className={`absolute left-0.5 top-0.5 w-5 h-5 bg-ancient-bg-dark rounded-full shadow-md transform transition-transform duration-200
        ${checked ? 'translate-x-6' : 'translate-x-0'}`}></div>
    </div>
  </label>
);


// ThemedMemberListItem - a new sub-component
const ThemedMemberListItem = ({ member, currentUserIsAdmin, groupAdminId, onRemove, onChangeRole }) => {
  const isSelf = member.id === useAuthStore((s) => s.userInfo.id);
  const isAdmin = member.role === 'admin';
  const isGroupCreator = member.id === groupAdminId; // Assuming groupAdminId is the creator's ID

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-ancient-input-bg transition-colors duration-200 group">
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 rounded-full overflow-hidden bg-ancient-input-bg flex-shrink-0 border border-ancient-border-stone">
          <Image src={member.profileImage || "/default_mystical_avatar.png"} alt={member.name} fill className="object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="text-ancient-text-light text-base font-medium flex items-center gap-2">
            {member.name} {isSelf && <span className="text-ancient-text-muted text-xs">(You)</span>}
          </span>
          <span className="text-ancient-text-muted text-xs italic">
            {isAdmin ? "Conclave Elder" : "Disciple"} {isGroupCreator && <span className="font-bold text-ancient-icon-glow">(Founder)</span>}
          </span>
        </div>
      </div>
      {currentUserIsAdmin && !isSelf && ( // Only admins can manage others, not themselves here
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onChangeRole(member.id, isAdmin ? 'member' : 'admin')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200
              ${isAdmin ? 'bg-ancient-border-stone text-ancient-text-light hover:bg-ancient-input-border' : 'bg-ancient-icon-glow text-ancient-bg-dark hover:bg-ancient-bubble-user-light'}`}
            disabled={isGroupCreator} // Founder's role can't be changed by other admins
          >
            {isAdmin ? 'Demote' : 'Promote'}
          </button>
          <button
            onClick={() => onRemove(member.id)}
            className="p-2 rounded-full bg-red-700/70 hover:bg-red-600 text-white transition-colors duration-200"
          >
            <IoRemove className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};


// AddParticipantModal - a new component for adding members
const AddParticipantModal = ({ open, onClose, existingMembers, onAddMembers, isLoadingContacts, flatContacts, isAddingMembers }) => {
  const [selectedAdd, setSelectedAdd] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedAdd([]);
      setSearchTerm("");
    }
  }, [open]);

  const filteredContacts = useMemo(() => {
    const existingIds = new Set(existingMembers.map(m => m.id));
    const availableContacts = flatContacts.filter(contact => !existingIds.has(contact.id));

    if (!searchTerm) return availableContacts;
    return availableContacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(contact.id).includes(searchTerm)
    );
  }, [flatContacts, searchTerm, existingMembers]);

  const toggleSelection = (uid) =>
    setSelectedAdd((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));

  const handleSubmit = () => {
    onAddMembers(selectedAdd);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-ancient-bg-dark rounded-xl w-full max-w-lg shadow-2xl border border-ancient-border-stone animate-zoom-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-ancient-bg-medium border-b border-ancient-border-stone">
          <button
            onClick={onClose}
            className="text-ancient-text-muted hover:text-ancient-icon-glow transition-colors duration-200"
            aria-label="Close"
          >
            <IoArrowBack className="h-7 w-7" />
          </button>
          <h3 className="text-ancient-text-light text-xl font-bold flex items-center gap-2">
            <FaFolderOpen className="text-ancient-icon-glow" /> Entrust New Disciples
          </h3>
          <div className="w-7"></div> {/* Placeholder for alignment */}
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-ancient-border-stone bg-ancient-input-bg">
          <ThemedInput
            name="Search Spirits"
            state={searchTerm}
            setState={setSearchTerm}
            placeholder="Search for spirits to entrust..."
            Icon={FaMagic}
          />
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 max-h-[400px]">
          {isLoadingContacts && (
            <div className="text-ancient-text-muted text-center py-8">
              Summoning spirits from the ethereal plane...
            </div>
          )}
          {!isLoadingContacts && filteredContacts.length === 0 && (
            <div className="text-ancient-text-muted text-center py-8">
              No new spirits found for entrusting.
            </div>
          )}
          {!isLoadingContacts && filteredContacts.map((contact) => (
            <label key={contact.id} className="flex items-center justify-between gap-3 px-4 py-2 rounded-lg hover:bg-ancient-bubble-user-light transition-colors duration-200 cursor-pointer border border-transparent has-checked:border-ancient-icon-glow">
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
                checked={selectedAdd.includes(contact.id)}
                onChange={() => toggleSelection(contact.id)}
                className="h-5 w-5 rounded-full border-ancient-input-border bg-ancient-input-bg checked:bg-ancient-icon-glow checked:border-transparent focus:ring-ancient-icon-glow focus:ring-1 transition-colors duration-200"
              />
            </label>
          ))}
        </div>

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
      </div>
    </div>
  );
};


export default function GroupManageModal({ open, onClose, groupId }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const currentChatUser = useChatStore((s) => s.currentChatUser); // This should be the group's data

  // State for Group Settings
  const [localGroupName, setLocalGroupName] = useState("");
  const [localGroupDescription, setLocalGroupDescription] = useState("");
  const [localGroupIconFile, setLocalGroupIconFile] = useState(null);
  const [localGroupIconUrl, setLocalGroupIconUrl] = useState(""); // For displaying current URL or file preview

  const [showAddParticipantsModal, setShowAddParticipantsModal] = useState(false);

  // Hooks for mutations
  const updateSettings = useUpdateGroupSettings();
  const addMembers = useAddGroupMembers();
  const removeMembers = useRemoveGroupMembers();
  const updateRole = useUpdateGroupRole();
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();

  // Fetch all contacts for adding new members
  const { data: allContactsSections = {}, isLoading: isLoadingContacts } = useAllContacts();
  const flatAllContacts = useMemo(() => {
    return Object.values(allContactsSections).flat().map((u) => ({ id: u.id, name: u.name, image: u.profileImage }));
  }, [allContactsSections]);

  // Derive group data from currentChatUser if it's the target group
  // Assuming currentChatUser contains group details (members, name, description, icon, adminId, etc.)
  const groupData = useMemo(() => {
    if (currentChatUser?.isGroup && currentChatUser.id === groupId) {
      return currentChatUser;
    }
    return null;
  }, [currentChatUser, groupId]);

  const currentUserIsAdmin = useMemo(() => {
    return groupData?.members?.some(
      (m) => m.id === userInfo?.id && m.role === 'admin'
    );
  }, [groupData, userInfo]);

  const groupCreatorId = groupData?.adminId; // Assuming adminId is the original creator


  // Initialize local state with groupData
  useEffect(() => {
    if (groupData) {
      setLocalGroupName(groupData.name || "");
      setLocalGroupDescription(groupData.description || "");
      setLocalGroupIconUrl(groupData.profileImage || "");
      setLocalGroupIconFile(null); // Clear file input on group change
    }
  }, [groupData]);

  // Handlers for mutations
  const handleUpdateSettings = () => {
    if (!groupId) return;
    const formData = new FormData();
    formData.append("groupId", groupId);
    formData.append("groupName", localGroupName.trim());
    formData.append("groupDescription", localGroupDescription.trim());
    if (localGroupIconFile) {
      formData.append("groupIcon", localGroupIconFile);
    } else if (localGroupIconUrl) {
      // If icon was just a URL and no new file was selected, send the URL back
      // Or handle this in your backend to keep existing if no file/new URL
    }

    updateSettings.mutate(formData, {
      onSuccess: () => {
        showToast.success("Conclave details re-inscribed!");
      },
      onError: () => showToast.error("Failed to re-inscribe conclave details."),
    });
  };

  const handleAddMembers = useCallback((membersToAdd) => {
    if (!groupId || membersToAdd.length === 0) return;
    addMembers.mutate({ groupId, members: membersToAdd }, {
      onSuccess: () => {
        showToast.success("New disciples entrusted to the conclave!");
        setShowAddParticipantsModal(false);
      },
      onError: () => showToast.error("Failed to entrust new disciples."),
    });
  }, [addMembers, groupId]);


  const handleRemoveMember = (memberId) => {
    if (!groupId || !memberId) return;
    removeMembers.mutate({ groupId, members: [memberId] }, {
      onSuccess: () => showToast.success("Disciple banished from the conclave."),
      onError: () => showToast.error("Failed to banish disciple."),
    });
  };

  const handleChangeMemberRole = (userId, role) => {
    if (!groupId || !userId) return;
    updateRole.mutate({ groupId, userId, role }, {
      onSuccess: () => showToast.success("Disciple's rank changed."),
      onError: () => showToast.error("Failed to change disciple's rank."),
    });
  };

  const handleLeaveGroup = () => {
    if (!groupId) return;
    if (window.confirm("Are you sure you want to abandon the conclave?")) { // Themed confirmation
      leaveGroup.mutate(groupId, {
        onSuccess: () => {
          showToast.info("You have abandoned the conclave.");
          onClose?.();
        },
        onError: () => showToast.error("Failed to abandon the conclave."),
      });
    }
  };

  const handleDeleteGroup = () => {
    if (!groupId) return;
    if (window.confirm("Are you certain you wish to utterly dissolve this ancient conclave? This action cannot be undone.")) { // Themed confirmation
      deleteGroup.mutate(groupId, {
        onSuccess: () => {
          showToast.info("The conclave has been utterly dissolved.");
          onClose?.();
        },
        onError: () => showToast.error("Failed to dissolve the conclave."),
      });
    }
  };

  if (!open || !groupData) return null; // Ensure groupData is available

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ancient-bg-dark text-ancient-text-light animate-fade-in">
      {/* Header */}
      <div className="flex items-center p-4 bg-ancient-bg-medium border-b border-ancient-border-stone shadow-lg">
        <button
          onClick={onClose}
          className="text-ancient-text-muted hover:text-ancient-icon-glow transition-colors duration-200 mr-4"
          aria-label="Back"
        >
          <IoArrowBack className="h-7 w-7" />
        </button>
        <h3 className="text-ancient-text-light text-xl font-bold flex items-center gap-2">
          <FaTabletAlt className="text-ancient-icon-glow" /> Conclave Grimoire
        </h3>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-20"> {/* pb-20 for bottom buttons */}

        {/* Group Info Section */}
        <div className="flex flex-col items-center gap-6 bg-ancient-bg-medium rounded-xl p-6 border border-ancient-border-stone shadow-xl">
          <ThemedAvatarUpload
            iconFile={localGroupIconFile}
            setIconFile={setLocalGroupIconFile}
            name={localGroupName}
            currentIconUrl={localGroupIconUrl}
            isEditable={currentUserIsAdmin}
          />
          <div className="w-full max-w-sm space-y-4">
            <ThemedInput
              name="Conclave Name"
              state={localGroupName}
              setState={setLocalGroupName}
              placeholder="E.g., Whispering Circle, Council of Elders"
              Icon={FaScroll}
              label
              isEditable={currentUserIsAdmin}
            />
            <ThemedInput
              name="Conclave Purpose"
              state={localGroupDescription}
              setState={setLocalGroupDescription}
              placeholder="Share the purpose of your gathering..."
              Icon={FaFeather}
              label
              isEditable={currentUserIsAdmin}
            />
          </div>
          {currentUserIsAdmin && (
            <button
              onClick={handleUpdateSettings}
              disabled={updateSettings.isPending}
              className="bg-ancient-icon-glow hover:bg-ancient-bubble-user-light text-ancient-bg-dark font-bold text-base px-6 py-2 rounded-lg shadow-md transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {updateSettings.isPending ? "Re-inscribing..." : "Re-inscribe Details"} <FaMagic />
            </button>
          )}
        </div>

        {/* Members Section */}
        <div className="bg-ancient-bg-medium rounded-xl p-6 border border-ancient-border-stone shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-ancient-input-border">
            <h4 className="text-ancient-text-light text-2xl font-bold flex items-center gap-3">
              <FaUsers className="text-ancient-icon-glow" /> Conclave Disciples ({groupData.members?.length || 0})
            </h4>
            {currentUserIsAdmin && (
              <button
                onClick={() => setShowAddParticipantsModal(true)}
                className="bg-ancient-icon-glow hover:bg-ancient-bubble-user-light text-ancient-bg-dark p-2 rounded-full shadow-md transform hover:scale-110 transition-all duration-200"
                aria-label="Add Participant"
              >
                <IoAdd className="h-6 w-6" />
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
            {groupData.members?.length === 0 && (
              <div className="text-ancient-text-muted text-center py-4">No disciples yet.</div>
            )}
            {groupData.members?.map((member) => (
              <ThemedMemberListItem
                key={member.id}
                member={member}
                currentUserIsAdmin={currentUserIsAdmin}
                groupAdminId={groupCreatorId}
                onRemove={handleRemoveMember}
                onChangeRole={handleChangeMemberRole}
              />
            ))}
          </div>
        </div>

        {/* Group Permissions/Ephemeral Messages Section (Example) */}
        {currentUserIsAdmin && (
          <div className="bg-ancient-bg-medium rounded-xl p-6 border border-ancient-border-stone shadow-xl">
            <h4 className="text-ancient-text-light text-2xl font-bold flex items-center gap-3 mb-4 pb-4 border-b border-ancient-input-border">
              <FaLock className="text-ancient-icon-glow" /> Conclave Edicts
            </h4>
            <div className="space-y-4">
              <ThemedSwitch
                label="Ephemeral Whispers (Disappearing Messages)"
                checked={groupData.ephemeralMessages || false} // Placeholder for actual group setting
                onChange={() => showToast.info("Feature not yet implemented for this ancient scroll.")} // Placeholder
                isEditable={currentUserIsAdmin}
              />
              {/* Add more settings here */}
              <div className="flex items-center justify-between p-4 bg-ancient-input-bg rounded-lg border border-ancient-input-border shadow-inner cursor-pointer hover:bg-ancient-bubble-user-light transition-all duration-200">
                <span className="text-ancient-text-light text-lg flex items-center gap-2">
                    <FaShieldAlt className="text-ancient-text-muted" /> Battleground Rules
                </span>
                <IoChevronForward className="text-ancient-text-muted text-xl" />
              </div>
            </div>
          </div>
        )}


        {/* Danger Zone */}
        <div className="bg-red-900/20 rounded-xl p-6 border border-red-700 shadow-xl space-y-4">
            <h4 className="text-red-400 text-2xl font-bold flex items-center gap-3 mb-4 pb-4 border-b border-red-700">
              <FaFire className="text-red-400" /> Forbidden Edicts
            </h4>
            <button
                onClick={handleLeaveGroup}
                className="w-full text-left p-4 bg-ancient-input-bg hover:bg-red-800/50 rounded-lg text-red-300 font-bold flex items-center justify-between transition-colors duration-200"
            >
                <span>Abandon Conclave</span>
                <IoExitOutline className="text-red-300 text-2xl" />
            </button>
            {currentUserIsAdmin && ( // Only admin can delete group
                <button
                    onClick={handleDeleteGroup}
                    className="w-full text-left p-4 bg-ancient-input-bg hover:bg-red-800/70 rounded-lg text-red-400 font-bold flex items-center justify-between transition-colors duration-200"
                >
                    <span>Utterly Dissolve Conclave</span>
                    <IoTrash className="text-red-400 text-2xl" />
                </button>
            )}
        </div>

      </div>

      {/* Add Participants Modal (overlay over the current screen) */}
      <AddParticipantModal
        open={showAddParticipantsModal}
        onClose={() => setShowAddParticipantsModal(false)}
        existingMembers={groupData.members || []}
        onAddMembers={handleAddMembers}
        isLoadingContacts={isLoadingContacts}
        flatContacts={flatAllContacts}
        isAddingMembers={addMembers.isPending}
      />
    </div>
  );
}