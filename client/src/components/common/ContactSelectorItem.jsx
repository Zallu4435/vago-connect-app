"use client";
import React from "react";
import Image from "next/image";

export default function ContactSelectorItem({ contact, isSelected, onToggle }) {
  return (
    <label
      className="
        flex items-center justify-between gap-2 sm:gap-3
        px-3 sm:px-4 py-2 sm:py-3 rounded-lg
        hover:bg-ancient-bubble-user-light transition-colors duration-200
        cursor-pointer border border-transparent
        has-checked:border-ancient-icon-glow
      "
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full overflow-hidden bg-ancient-input-bg flex-shrink-0">
          <Image
            src={contact.image || "/default_avatar.png"}
            alt={contact.name || "Unknown Contact"}
            fill
            className="object-cover"
            priority={true}
          />
        </div>
        <div className="flex flex-col min-w-0 truncate">
          <span className="text-ancient-text-light text-sm sm:text-base font-medium truncate">
            {contact.name}
          </span>
          <span className="text-ancient-text-muted text-[10px] sm:text-xs italic truncate">
            ID: {contact.id}
          </span>
        </div>
      </div>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(contact.id)}
        className="
          h-4 w-4 sm:h-5 sm:w-5 rounded-full border-ancient-input-border
          bg-ancient-input-bg checked:bg-ancient-icon-glow checked:border-transparent
          focus:ring-ancient-icon-glow focus:ring-1 transition-colors duration-200
          flex-shrink-0
        "
        aria-label={`Select contact ${contact.name}`}
      />
    </label>
  );
}
