"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";

import { useUpdateGroupSettings } from '@/hooks/groups/useUpdateGroupSettings';
import { useAddGroupMembers, useRemoveGroupMembers } from '@/hooks/groups/useGroupMembers';
import { useUpdateGroupRole } from '@/hooks/groups/useUpdateGroupRole';
import { useLeaveGroup, useDeleteGroup } from '@/hooks/groups/useGroupActions';
import { showToast } from "@/lib/toast";
import { IoArrowBack, IoAdd, IoTrash, IoExitOutline, IoChevronForward } from "react-icons/io5";
import { FaMagic, FaScroll, FaFeather, FaTabletAlt, FaUsers, FaLock, FaFire, FaShieldAlt } from "react-icons/fa";
import ThemedInput from "@/components/common/ThemedInput";
import ThemedSwitch from "@/components/common/ThemedSwitch";
import AvatarUpload from "@/components/common/AvatarUpload";
import ThemedMemberListItem from './ThemedMemberListItem';
import AddParticipantModal from './AddParticipantModal';
import ConfirmModal from "@/components/common/ConfirmModal";
import ModalHeader from "@/components/common/ModalHeader";
import AnimatedPanel from "@/components/common/AnimatedPanel";



export default function GroupManageModal({ open, onClose, groupId }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const currentChatUser = useChatStore((s) => s.currentChatUser); // This should be the group's data
  const setCurrentChatUser = useChatStore((s) => s.setCurrentChatUser);
  const queryClient = useQueryClient();

  // State for Group Settings
  const [localGroupName, setLocalGroupName] = useState("");
  const [localGroupDescription, setLocalGroupDescription] = useState("");
  const [localGroupIconFile, setLocalGroupIconFile] = useState(null);
  const [localGroupIconUrl, setLocalGroupIconUrl] = useState(""); // For displaying current URL or file preview

  const [showAddParticipantsModal, setShowAddParticipantsModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Confirm: Remove member
  const [confirmRemove, setConfirmRemove] = useState({ open: false, memberId: null, memberName: "" });
  // Confirm: Demote admin
  const [confirmDemote, setConfirmDemote] = useState({ open: false, userId: null, memberName: "" });

  // Hooks for mutations
  const updateSettings = useUpdateGroupSettings();
  const addMembers = useAddGroupMembers();
  const removeMembers = useRemoveGroupMembers();
  const updateRole = useUpdateGroupRole();
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();


  // Derive group data from currentChatUser if it's the target group
  // Assuming currentChatUser contains group details (members, name, description, icon, adminId, etc.)
  const groupData = useMemo(() => {
    if (currentChatUser && (currentChatUser.id === groupId || currentChatUser.conversationId === groupId)) {
      return currentChatUser;
    }
    return null;
  }, [currentChatUser, groupId]);

  const isLeft = useMemo(() => {
    if (groupData?.leftAt) return true;
    return !!groupData?.participants?.some(
      (p) => String(p.userId) === String(userInfo?.id) && p.leftAt
    );
  }, [groupData, userInfo]);

  const currentUserIsAdmin = useMemo(() => {
    if (isLeft) return false;
    return !!groupData?.participants?.some(
      (p) => String(p.userId) === String(userInfo?.id) && p.role === 'admin' && !p.leftAt
    );
  }, [groupData, userInfo, isLeft]);

  const groupCreatorId = groupData?.createdById; // original creator


  // Initialize local state with groupData
  useEffect(() => {
    if (groupData) {
      setLocalGroupName(groupData.name || "");
      setLocalGroupDescription(groupData.description || "");
      setLocalGroupIconUrl(groupData.profilePicture || "");
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
      formData.append("groupIconUrl", localGroupIconUrl);
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
      onError: () => {
        const errorMsg = "Failed to add members.";
        showToast.error(errorMsg);
      },
    });
  }, [addMembers, groupId]);


  // Stage a removal confirmation — admins are already blocked in ThemedMemberListItem
  const handleRemoveMember = (memberId) => {
    if (!groupId || !memberId) return;
    const participant = groupData?.participants?.find(
      (p) => String(p.userId) === String(memberId)
    );
    setConfirmRemove({
      open: true,
      memberId,
      memberName: participant?.user?.name || "this member",
    });
  };

  const executeRemoveMember = () => {
    if (!confirmRemove.memberId) return;
    removeMembers.mutate({ groupId, members: [confirmRemove.memberId] }, {
      onSuccess: () => {
        showToast.success("Member removed.");
        setConfirmRemove({ open: false, memberId: null, memberName: "" });
      },
      onError: () => showToast.error("Failed to remove member."),
    });
  };

  const handleChangeMemberRole = (userId, role) => {
    if (!groupId || !userId) return;
    // Demoting an admin — ask for confirmation first
    if (role === "member") {
      const participant = groupData?.participants?.find(
        (p) => String(p.userId) === String(userId)
      );
      setConfirmDemote({
        open: true,
        userId,
        memberName: participant?.user?.name || "this admin",
      });
      return;
    }
    // Promoting a member — no confirm needed
    updateRole.mutate({ groupId, userId, role }, {
      onSuccess: () => showToast.success("Member promoted to admin."),
      onError: () => showToast.error("Failed to update role."),
    });
  };

  const executeDemote = () => {
    if (!confirmDemote.userId) return;
    updateRole.mutate({ groupId, userId: confirmDemote.userId, role: "member" }, {
      onSuccess: () => {
        showToast.success("Admin demoted to member.");
        setConfirmDemote({ open: false, userId: null, memberName: "" });
      },
      onError: () => {
        showToast.error("Failed to demote admin.");
        setConfirmDemote({ open: false, userId: null, memberName: "" });
      },
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

  const confirmDeleteGroup = async () => {
    if (!groupId) return;

    try {
      // 1. Leave the group first (to notify others and record status)
      await leaveGroup.mutateAsync(groupId);

      // 2. Actually delete the group
      deleteGroup.mutate(groupId, {
        onSuccess: () => {
          showToast.info("Group deleted.");
          setShowDeleteConfirm(false);
          onClose?.();
        },
        onError: () => showToast.error("Failed to delete group."),
      });
    } catch (e) {
      console.error("Delete sequence error:", e);
      // Fallback: try delete even if leave failed (might be a permission quirk)
      deleteGroup.mutate(groupId);
    }
  };

  if (!open || !groupData) return null; // Ensure groupData is available

  return (
    <AnimatedPanel open={open} direction="right">
      {/* Header */}
      <ModalHeader
        title={isLeft ? "Group info" : "Group settings"}
        Icon={isLeft ? FaUsers : FaTabletAlt}
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
          {currentUserIsAdmin && !isLeft && (
            <button
              onClick={handleUpdateSettings}
              disabled={updateSettings.isPending}
              className="bg-ancient-icon-glow hover:bg-ancient-bubble-user-light text-ancient-bg-dark font-bold text-base px-6 py-2 rounded-lg shadow-md transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {updateSettings.isPending ? "Saving..." : "Save changes"} <FaMagic />
            </button>
          )}
          {isLeft && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm font-medium">
              You are no longer a member of this group and cannot edit its settings.
            </div>
          )}
        </div>

        {/* Members Section */}
        <div className="bg-ancient-bg-medium rounded-xl p-6 border border-ancient-border-stone shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-ancient-input-border">
            <h4 className="text-ancient-text-light text-2xl font-bold flex items-center gap-3">
              <FaUsers className="text-ancient-icon-glow" /> Members ({groupData.participants?.filter(p => !Boolean(p.leftAt)).length || 0})
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
            {groupData.participants?.filter(p => !Boolean(p.leftAt)).length === 0 && (
              <div className="text-ancient-text-muted text-center py-4">No members yet.</div>
            )}
            {groupData.participants?.filter(p => !Boolean(p.leftAt)).map((p) => (
              <ThemedMemberListItem
                key={p.userId}
                member={{
                  id: p.userId,
                  name: p.user?.name || "Unknown",
                  profileImage: p.user?.profileImage,
                  role: p.role
                }}
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


        {/* Danger zone - Only show if user is still in group */}
        {!isLeft && (
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
            {currentUserIsAdmin && (
              <button
                onClick={handleDeleteGroup}
                className="w-full text-left p-4 bg-ancient-input-bg hover:bg-red-800/70 rounded-lg text-red-400 font-bold flex items-center justify-between transition-colors duration-200"
              >
                <span>Delete group</span>
                <IoTrash className="text-red-400 text-2xl" />
              </button>
            )}
          </div>
        )}

      </div>

      {/* Add Participants Modal (overlay over the current screen) */}
      <AddParticipantModal
        open={showAddParticipantsModal}
        onClose={() => setShowAddParticipantsModal(false)}
        existingMembers={groupData.participants?.filter(p => !p.leftAt).map(p => ({ id: p.userId })) || []}
        onAddMembers={handleAddMembers}
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

      {/* Confirm: Remove Member */}
      <ConfirmModal
        open={confirmRemove.open}
        onClose={() => setConfirmRemove({ open: false, memberId: null, memberName: "" })}
        onConfirm={executeRemoveMember}
        title={`Remove ${confirmRemove.memberName}?`}
        description={`${confirmRemove.memberName} will be removed from this group and will no longer receive messages.`}
        confirmText="Remove"
        cancelText="Cancel"
        confirmLoading={removeMembers.isPending}
        variant="danger"
      />

      {/* Confirm: Demote Admin */}
      <ConfirmModal
        open={confirmDemote.open}
        onClose={() => setConfirmDemote({ open: false, userId: null, memberName: "" })}
        onConfirm={executeDemote}
        title={`Demote ${confirmDemote.memberName}?`}
        description={`${confirmDemote.memberName} will lose admin privileges and become a regular member.`}
        confirmText="Demote"
        cancelText="Cancel"
        confirmLoading={updateRole.isPending}
        variant="warning"
      />
    </AnimatedPanel>
  );
}