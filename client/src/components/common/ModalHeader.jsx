"use client";
import React from "react";
import { IoArrowBack, IoClose } from "react-icons/io5";

export default function ModalHeader({
  title,
  Icon,
  onBack,
  onClose,
  centerTitle = false,
  className = "",
}) {
  const LeftButton = () => {
    if (onBack) {
      return (
        <button
          onClick={onBack}
          className="text-ancient-text-muted hover:text-ancient-icon-glow transition-colors duration-200 p-1 sm:p-2 rounded focus:outline-none"
          aria-label="Back"
        >
          <IoArrowBack className="h-6 w-6 sm:h-7 sm:w-7" />
        </button>
      );
    }
    if (onClose) {
      return (
        <button
          onClick={onClose}
          className="text-ancient-text-muted hover:text-ancient-icon-glow transition-colors duration-200 p-1 sm:p-2 rounded focus:outline-none"
          aria-label="Close"
        >
          <IoClose className="h-6 w-6 sm:h-7 sm:w-7" />
        </button>
      );
    }
    return <div className="w-6 sm:w-7" />;
  };

  return (
    <div className={`
      flex items-center p-3 sm:p-4 bg-ancient-bg-medium border-b border-ancient-border-stone
      ${centerTitle ? "justify-between" : ""}
      ${className}
    `}>
      <LeftButton />
      <h3 className={`
        text-ancient-text-light text-lg sm:text-xl font-bold flex items-center gap-1 sm:gap-2 mx-auto
        truncate
      `}>
        {typeof Icon === "function" ? <Icon className="text-ancient-icon-glow text-lg sm:text-xl" /> : null}
        <span className="truncate">{title}</span>
      </h3>
      {/* Fill in the right side for balanced centering when centerTitle is set */}
      {centerTitle ? <div className="w-6 sm:w-7" /> : null}
    </div>
  );
}
