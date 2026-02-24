"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useAllContacts } from "@/hooks/queries/useAllContacts";
import { useUpdateGroupSettings } from "@/hooks/mutations/useUpdateGroupSettings";
import { useAddGroupMembers, useRemoveGroupMembers } from "@/hooks/mutations/useGroupMembers";
import { useUpdateGroupRole } from "@/hooks/mutations/useUpdateGroupRole";
import { useLeaveGroup, useDeleteGroup } from "@/hooks/mutations/useGroupActions";
import { showToast } from "@/lib/toast";
import { IoArrowBack, IoAdd, IoTrash, IoExitOutline, IoChevronForward } from "react-icons/io5";
import { FaMagic, FaScroll, FaFeather, FaTabletAlt, FaUsers, FaLock, FaFire, FaShieldAlt } from "react-icons/fa";
import ThemedInput from "@/components/common/ThemedInput";
import ThemedSwitch from "@/components/common/ThemedSwitch";
import AvatarUpload from "@/components/common/AvatarUpload";
import ThemedMemberListItem from "@/components/Chat/GroupManageModal/ThemedMemberListItem";
import AddParticipantModal from "@/components/Chat/GroupManageModal/AddParticipantModal";
import ConfirmModal from "@/components/common/ConfirmModal";
import ModalHeader from "@/components/common/ModalHeader";



export default function GroupManageModal({ open, onClose, groupId }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const currentChatUser = useChatStore((s) => s.currentChatUser); // This should be the group's data

  // State for Group Settings
  const [localGroupName, setLocalGroupName] = useState("");
  const [localGroupDescription, setLocalGroupDescription] = useState("");
  const [localGroupIconFile, setLocalGroupIconFile] = useState(null);
  const [localGroupIconUrl, setLocalGroupIconUrl] = useState(""); // For displaying current URL or file preview

  const [showAddParticipantsModal, setShowAddParticipantsModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    return Object.values(allContactsSections)
      .flat()
      .filter((u) => String(u.id) !== String(userInfo?.id))
      .map((u) => ({
        id: u.id,
        name: u.name,
        about: u.about,
        image: u.profileImage,
      }));
  }, [allContactsSections, userInfo]);

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
        showToast.success("Group details updated.");
      },
      onError: () => showToast.error("Failed to update group details."),
    });
  };

  const handleAddMembers = useCallback((membersToAdd) => {
    if (!groupId || membersToAdd.length === 0) return;
    addMembers.mutate({ groupId, members: membersToAdd }, {
      onSuccess: () => {
        showToast.success("Members added.");
        setShowAddParticipantsModal(false);
      },
      onError: () => showToast.error("Failed to add members."),
    });
  }, [addMembers, groupId]);


  const handleRemoveMember = (memberId) => {
    if (!groupId || !memberId) return;
    removeMembers.mutate({ groupId, members: [memberId] }, {
      onSuccess: () => showToast.success("Member removed."),
      onError: () => showToast.error("Failed to remove member."),
    });
  };

  const handleChangeMemberRole = (userId, role) => {
    if (!groupId || !userId) return;
    updateRole.mutate({ groupId, userId, role }, {
      onSuccess: () => showToast.success("Role updated."),
      onError: () => showToast.error("Failed to update role."),
    });
  };

  const handleLeaveGroup = () => {
    if (!groupId) return;
    setShowLeaveConfirm(true);
  };

  const confirmLeaveGroup = () => {
    if (!groupId) return;
    leaveGroup.mutate(groupId, {
      onSuccess: () => {
        showToast.info("You left the group.");
        setShowLeaveConfirm(false);
        onClose?.();
      },
      onError: () => showToast.error("Failed to leave the group."),
    });
  };

  const handleDeleteGroup = () => {
    if (!groupId) return;
    setShowDeleteConfirm(true);
  };

  const confirmDeleteGroup = () => {
    if (!groupId) return;
    deleteGroup.mutate(groupId, {
      onSuccess: () => {
        showToast.info("Group deleted.");
        setShowDeleteConfirm(false);
        onClose?.();
      },
      onError: () => showToast.error("Failed to delete group."),
    });
  };

  if (!open || !groupData) return null; // Ensure groupData is available

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ancient-bg-dark text-ancient-text-light animate-fade-in">
      {/* Header */}
      <ModalHeader
        title="Group settings"
        Icon={FaTabletAlt}
        onBack={onClose}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-20"> {/* pb-20 for bottom buttons */}

        {/* Group Info Section */}
        <div className="flex flex-col items-center gap-6 bg-ancient-bg-medium rounded-xl p-6 border border-ancient-border-stone shadow-xl">
          <AvatarUpload
            iconFile={localGroupIconFile}
            setIconFile={setLocalGroupIconFile}
            name={localGroupName}
            currentIconUrl={localGroupIconUrl}
            isEditable={currentUserIsAdmin}
          />
          <div className="w-full max-w-sm space-y-4">
            <ThemedInput
              name="Group name"
              state={localGroupName}
              setState={setLocalGroupName}
              placeholder="Enter a group name"
              Icon={FaScroll}
              label
              isEditable={currentUserIsAdmin}
            />
            <ThemedInput
              name="Description"
              state={localGroupDescription}
              setState={setLocalGroupDescription}
              placeholder="Add a description (optional)"
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
              {updateSettings.isPending ? "Saving..." : "Save changes"} <FaMagic />
            </button>
          )}
        </div>

        {/* Members Section */}
        <div className="bg-ancient-bg-medium rounded-xl p-6 border border-ancient-border-stone shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-ancient-input-border">
            <h4 className="text-ancient-text-light text-2xl font-bold flex items-center gap-3">
              <FaUsers className="text-ancient-icon-glow" /> Members ({groupData.members?.length || 0})
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
              <div className="text-ancient-text-muted text-center py-4">No members yet.</div>
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
              <FaLock className="text-ancient-icon-glow" /> Settings
            </h4>
            <div className="space-y-4">
              <ThemedSwitch
                label="Disappearing messages"
                checked={groupData.ephemeralMessages || false} // Placeholder for actual group setting
                onChange={() => showToast.info("Not implemented yet.")} // Placeholder
                isEditable={currentUserIsAdmin}
              />
              {/* Add more settings here */}
              <div className="flex items-center justify-between p-4 bg-ancient-input-bg rounded-lg border border-ancient-input-border shadow-inner cursor-pointer hover:bg-ancient-bubble-user-light transition-all duration-200">
                <span className="text-ancient-text-light text-lg flex items-center gap-2">
                  <FaShieldAlt className="text-ancient-text-muted" /> Group rules
                </span>
                <IoChevronForward className="text-ancient-text-muted text-xl" />
              </div>
            </div>
          </div>
        )}


        {/* Danger zone */}
        <div className="bg-red-900/20 rounded-xl p-6 border border-red-700 shadow-xl space-y-4">
          <h4 className="text-red-400 text-2xl font-bold flex items-center gap-3 mb-4 pb-4 border-b border-red-700">
            <FaFire className="text-red-400" /> Danger zone
          </h4>
          <button
            onClick={handleLeaveGroup}
            className="w-full text-left p-4 bg-ancient-input-bg hover:bg-red-800/50 rounded-lg text-red-300 font-bold flex items-center justify-between transition-colors duration-200"
          >
            <span>Leave group</span>
            <IoExitOutline className="text-red-300 text-2xl" />
          </button>
          {currentUserIsAdmin && ( // Only admin can delete group
            <button
              onClick={handleDeleteGroup}
              className="w-full text-left p-4 bg-ancient-input-bg hover:bg-red-800/70 rounded-lg text-red-400 font-bold flex items-center justify-between transition-colors duration-200"
            >
              <span>Delete group</span>
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

      {/* Confirm: Leave Group */}
      <ConfirmModal
        open={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={confirmLeaveGroup}
        title="Leave group?"
        description="You will leave this group. You can be re‑added later."
        confirmText="Leave"
        cancelText="Cancel"
        confirmLoading={leaveGroup.isPending}
        variant="warning"
      />

      {/* Confirm: Delete Group */}
      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteGroup}
        title="Delete group?"
        description="This will permanently delete the group for all members. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmLoading={deleteGroup.isPending}
        variant="danger"
      />
    </div>
  );
}