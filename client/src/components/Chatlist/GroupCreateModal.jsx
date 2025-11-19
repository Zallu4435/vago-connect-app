"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useAllContacts } from "@/hooks/queries/useAllContacts";
import { useCreateGroup } from "@/hooks/mutations/useCreateGroup";
import { showToast } from "@/lib/toast";

export default function GroupCreateModal({ open, onClose }) {
  const { data: sections = {}, isLoading } = useAllContacts();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconFile, setIconFile] = useState(null);
  const [selected, setSelected] = useState([]);
  const createGroup = useCreateGroup();

  useEffect(() => {
    if (!open) {
      setName(""); setDescription(""); setIconFile(null); setSelected([]);
    }
  }, [open]);

  const flatContacts = useMemo(() => {
    return Object.values(sections).flat().map((u) => ({ id: u.id, name: u.name, image: u.profileImage }));
  }, [sections]);

  const toggle = (uid) => setSelected((prev) => prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]);

  const canSubmit = name.trim().length > 0 && selected.length > 0;

  const onSubmit = () => {
    if (!canSubmit) return;
    const form = new FormData();
    form.append("groupName", name.trim());
    if (description.trim()) form.append("groupDescription", description.trim());
    if (iconFile) form.append("groupIcon", iconFile);
    selected.forEach((id) => form.append("memberIds", String(id)));
    createGroup.mutate(form, {
      onSuccess: () => { showToast.success("Group created"); onClose?.(); },
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#111b21] border border-[#2a3942] rounded-lg w-full max-w-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white text-base">Create Group</h3>
          <button className="text-bubble-meta hover:underline" onClick={onClose}>Close</button>
        </div>

        <div className="flex flex-col gap-2 mb-3">
          <input className="bg-[#1f2c33] border border-[#2a3942] rounded px-2 py-1 text-white" placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="bg-[#1f2c33] border border-[#2a3942] rounded px-2 py-1 text-white" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input type="file" accept="image/*" onChange={(e) => setIconFile(e.target.files?.[0] || null)} />
        </div>

        <div className="max-h-72 overflow-auto custom-scrollbar space-y-1 border border-[#2a3942] rounded p-2">
          {isLoading && <div className="text-bubble-meta text-sm">Loading contacts...</div>}
          {!isLoading && flatContacts.map((it) => (
            <label key={it.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#1f2c33]">
              <input type="checkbox" checked={selected.includes(it.id)} onChange={() => toggle(it.id)} />
              <div className="flex flex-col">
                <span className="text-white text-sm">{it.name}</span>
                <span className="text-bubble-meta text-xs">{it.id}</span>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button className="text-bubble-meta hover:underline" onClick={onClose}>Cancel</button>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-3 py-1 rounded disabled:opacity-50" disabled={!canSubmit || createGroup.isPending} onClick={onSubmit}>
            {createGroup.isPending ? "Creating..." : `Create (${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
