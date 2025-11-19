"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useAllContacts } from "@/hooks/queries/useAllContacts";
import { useUpdateGroupSettings } from "@/hooks/mutations/useUpdateGroupSettings";
import { useAddGroupMembers, useRemoveGroupMembers } from "@/hooks/mutations/useGroupMembers";
import { useUpdateGroupRole } from "@/hooks/mutations/useUpdateGroupRole";
import { showToast } from "@/lib/toast";

export default function GroupManageModal({ open, onClose, groupId }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const { data: sections = {}, isLoading } = useAllContacts();

  const [tab, setTab] = useState("settings");

  // Settings state
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupIconUrl, setGroupIconUrl] = useState("");

  // Members state
  const [selectedAdd, setSelectedAdd] = useState([]);
  const [selectedRemove, setSelectedRemove] = useState([]);

  // Roles state
  const [roleUserId, setRoleUserId] = useState("");
  const [role, setRole] = useState("member");

  const updateSettings = useUpdateGroupSettings();
  const addMembers = useAddGroupMembers();
  const removeMembers = useRemoveGroupMembers();
  const updateRole = useUpdateGroupRole();

  useEffect(() => {
    if (!open) {
      setTab("settings");
      setGroupName(""); setGroupDescription(""); setGroupIconUrl("");
      setSelectedAdd([]); setSelectedRemove([]);
      setRoleUserId(""); setRole("member");
    }
  }, [open]);

  const flatContacts = useMemo(() => {
    return Object.values(sections).flat().map((u) => ({ id: u.id, name: u.name }));
  }, [sections]);

  const toggleIn = (listSetter, list, uid) => {
    listSetter(list.includes(uid) ? list.filter((x) => x !== uid) : [...list, uid]);
  };

  const onSaveSettings = () => {
    if (!groupId) return;
    updateSettings.mutate({ groupId, groupName, groupDescription, groupIconUrl }, {
      onSuccess: () => showToast.success("Group settings updated"),
    });
  };

  const onAddMembers = () => {
    if (!groupId || selectedAdd.length === 0) return;
    addMembers.mutate({ groupId, members: selectedAdd }, {
      onSuccess: () => { showToast.success("Members added"); setSelectedAdd([]); },
    });
  };

  const onRemoveMembers = () => {
    if (!groupId || selectedRemove.length === 0) return;
    removeMembers.mutate({ groupId, members: selectedRemove }, {
      onSuccess: () => { showToast.success("Members removed"); setSelectedRemove([]); },
    });
  };

  const onUpdateRole = () => {
    const uid = Number(roleUserId);
    if (!groupId || !uid) return;
    updateRole.mutate({ groupId, userId: uid, role: role === 'admin' ? 'admin' : 'member' }, {
      onSuccess: () => showToast.success("Role updated"),
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#111b21] border border-[#2a3942] rounded-lg w-full max-w-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white text-base">Group Management</h3>
          <button className="text-bubble-meta hover:underline" onClick={onClose}>Close</button>
        </div>

        <div className="flex gap-2 mb-4">
          <button className={`px-3 py-1 rounded ${tab==='settings' ? 'bg-[#1f2c33] text-white' : 'text-bubble-meta'}`} onClick={() => setTab('settings')}>Settings</button>
          <button className={`px-3 py-1 rounded ${tab==='members' ? 'bg-[#1f2c33] text-white' : 'text-bubble-meta'}`} onClick={() => setTab('members')}>Members</button>
          <button className={`px-3 py-1 rounded ${tab==='roles' ? 'bg-[#1f2c33] text-white' : 'text-bubble-meta'}`} onClick={() => setTab('roles')}>Roles</button>
        </div>

        {tab === 'settings' && (
          <div className="flex flex-col gap-2">
            <input className="bg-[#1f2c33] border border-[#2a3942] rounded px-2 py-1 text-white" placeholder="Group name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            <input className="bg-[#1f2c33] border border-[#2a3942] rounded px-2 py-1 text-white" placeholder="Description" value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} />
            <input className="bg-[#1f2c33] border border-[#2a3942] rounded px-2 py-1 text-white" placeholder="Icon URL" value={groupIconUrl} onChange={(e) => setGroupIconUrl(e.target.value)} />
            <div className="flex justify-end">
              <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-3 py-1 rounded disabled:opacity-50" onClick={onSaveSettings} disabled={updateSettings.isPending}>
                {updateSettings.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {tab === 'members' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-white text-sm mb-2">Add members</div>
              <div className="max-h-64 overflow-auto custom-scrollbar border border-[#2a3942] rounded p-2">
                {isLoading && <div className="text-bubble-meta text-sm">Loading contacts...</div>}
                {!isLoading && flatContacts.map((it) => (
                  <label key={`add-${it.id}`} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#1f2c33]">
                    <input type="checkbox" checked={selectedAdd.includes(it.id)} onChange={() => toggleIn(setSelectedAdd, selectedAdd, it.id)} />
                    <span className="text-white text-sm">{it.name}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end mt-2">
                <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-3 py-1 rounded disabled:opacity-50" onClick={onAddMembers} disabled={addMembers.isPending || selectedAdd.length===0}>
                  {addMembers.isPending ? 'Adding...' : `Add (${selectedAdd.length})`}
                </button>
              </div>
            </div>
            <div>
              <div className="text-white text-sm mb-2">Remove members</div>
              <div className="max-h-64 overflow-auto custom-scrollbar border border-[#2a3942] rounded p-2">
                {!isLoading && flatContacts.map((it) => (
                  <label key={`rm-${it.id}`} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#1f2c33]">
                    <input type="checkbox" checked={selectedRemove.includes(it.id)} onChange={() => toggleIn(setSelectedRemove, selectedRemove, it.id)} />
                    <span className="text-white text-sm">{it.name}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end mt-2">
                <button className="bg-red-600 hover:bg-red-500 text-white text-sm px-3 py-1 rounded disabled:opacity-50" onClick={onRemoveMembers} disabled={removeMembers.isPending || selectedRemove.length===0}>
                  {removeMembers.isPending ? 'Removing...' : `Remove (${selectedRemove.length})`}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'roles' && (
          <div className="flex items-end gap-2">
            <input className="bg-[#1f2c33] border border-[#2a3942] rounded px-2 py-1 text-white" placeholder="User ID" value={roleUserId} onChange={(e) => setRoleUserId(e.target.value)} />
            <select className="bg-[#1f2c33] border border-[#2a3942] rounded px-2 py-1 text-white" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-3 py-1 rounded disabled:opacity-50" onClick={onUpdateRole} disabled={updateRole.isPending || !roleUserId}>
              {updateRole.isPending ? 'Updating...' : 'Update role'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
