"use client";
import React from "react";

export default function ThemedSwitch({ label, checked, onChange, isEditable = true }) {
  return (
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
}
