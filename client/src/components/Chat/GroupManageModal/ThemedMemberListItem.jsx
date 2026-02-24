"use client";
import React from "react";
import Image from "next/image";
import { IoRemove } from "react-icons/io5";
import { useAuthStore } from "@/stores/authStore";

export default function ThemedMemberListItem({ member, currentUserIsAdmin, groupAdminId, onRemove, onChangeRole }) {
  const isSelf = member.id === useAuthStore((s) => s.userInfo.id);
  const isAdmin = member.role === 'admin';
  const isGroupCreator = member.id === groupAdminId;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-ancient-input-bg transition-colors duration-200 group">
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 rounded-full overflow-hidden bg-ancient-input-bg flex-shrink-0 border border-ancient-border-stone">
          <Image src={member.profileImage || "/default_avatar.png"} alt={member.name} fill className="object-cover" />
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
      {currentUserIsAdmin && !isSelf && (
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onChangeRole(member.id, isAdmin ? 'member' : 'admin')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200
              ${isAdmin ? 'bg-ancient-border-stone text-ancient-text-light hover:bg-ancient-input-border' : 'bg-ancient-icon-glow text-ancient-bg-dark hover:bg-ancient-bubble-user-light'}`}
            disabled={isGroupCreator}
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
}
