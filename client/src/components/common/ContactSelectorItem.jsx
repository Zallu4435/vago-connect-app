"use client";
import React from "react";
import Image from "next/image";

export default function ContactSelectorItem({ contact, isSelected, onToggle }) {
  return (
    <label className="flex items-center justify-between gap-3 px-4 py-2 rounded-lg hover:bg-ancient-bubble-user-light transition-colors duration-200 cursor-pointer border border-transparent has-checked:border-ancient-icon-glow">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-ancient-input-bg flex-shrink-0">
          <Image src={contact.image || "/default_mystical_avatar.png"} alt={contact.name} fill className="object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="text-ancient-text-light text-base font-medium">{contact.name}</span>
          <span className="text-ancient-text-muted text-xs italic">ID: {contact.id}</span>
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
}
