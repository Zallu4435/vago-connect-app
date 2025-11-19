import React from "react";

function Input({ name, state, setState, label = false, placeholder, Icon }) {
  return (
    <div className="flex flex-col gap-1 w-full relative"> {/* Added relative for label positioning, w-full for consistent width */}
      {label && (
        <label
          htmlFor={name}
          className="text-ancient-text-muted text-sm px-1 absolute -top-3 left-3 bg-ancient-bg-medium z-10 rounded-md" // Themed label
        >
          {name}
        </label>
      )}
      <div className="relative flex items-center gap-3 bg-ancient-input-bg border border-ancient-input-border rounded-lg px-4 py-3 focus-within:border-ancient-icon-glow transition-all duration-300 shadow-inner">
        {Icon && <Icon className="text-ancient-icon-inactive text-xl" />} {/* Render the mystical icon */}
        <input
          type="text"
          name={name}
          value={state}
          onChange={(e) => setState(e.target.value)}
          placeholder={placeholder || `Enter your ${name.toLowerCase()}...`} // Themed placeholder
          className="flex-grow bg-transparent outline-none text-ancient-text-light placeholder:text-ancient-text-muted text-lg" // Themed text/placeholder
        />
      </div>
    </div>
  );
}

export default Input;