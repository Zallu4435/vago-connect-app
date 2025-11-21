"use client";
import React from "react";

export default function ThemedInput({ name, state, setState, label = false, placeholder, Icon, isEditable = true }) {
  return (
    <div className="flex flex-col gap-1 w-full relative">
      {label && (
        <label htmlFor={name} className="text-ancient-text-muted text-sm px-1 absolute -top-3 left-3 bg-ancient-bg-medium z-10 rounded-md">
          {name}
        </label>
      )}
      <div className={`relative flex items-center gap-3 bg-ancient-input-bg border rounded-lg px-4 py-3 transition-all duration-300 shadow-inner ${
        isEditable ? 'border-ancient-input-border focus-within:border-ancient-icon-glow' : 'border-transparent cursor-default'
      }`}>
        {typeof Icon === 'function' ? <Icon className="text-ancient-icon-inactive text-xl" /> : null}
        <input
          type="text"
          id={name}
          placeholder={placeholder || `Enter your ${String(name || '').toLowerCase()}...`}
          className={`flex-grow bg-transparent outline-none text-ancient-text-light placeholder:text-ancient-text-muted text-lg ${!isEditable ? 'pointer-events-none' : ''}`}
          value={state}
          onChange={(e) => isEditable && setState(e.target.value)}
          disabled={!isEditable}
        />
      </div>
    </div>
  );
}
