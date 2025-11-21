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
          className="text-ancient-text-muted hover:text-ancient-icon-glow transition-colors duration-200"
          aria-label="Back"
        >
          <IoArrowBack className="h-7 w-7" />
        </button>
      );
    }
    if (onClose) {
      return (
        <button
          onClick={onClose}
          className="text-ancient-text-muted hover:text-ancient-icon-glow transition-colors duration-200"
          aria-label="Close"
        >
          <IoClose className="h-7 w-7" />
        </button>
      );
    }
    return <div className="w-7" />;
  };

  return (
    <div className={`flex items-center ${centerTitle ? "justify-between" : ""} p-4 bg-ancient-bg-medium border-b border-ancient-border-stone ${className}`}>
      <LeftButton />
      <h3 className="text-ancient-text-light text-xl font-bold flex items-center gap-2 mx-auto">
        {typeof Icon === "function" ? <Icon className="text-ancient-icon-glow" /> : null}
        {title}
      </h3>
      {centerTitle ? <div className="w-7" /> : null}
    </div>
  );
}
