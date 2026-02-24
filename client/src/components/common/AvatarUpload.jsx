"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FaScroll, FaUsers } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

export default function AvatarUpload({ iconFile, setIconFile, name, currentIconUrl, isEditable = true, onClear }) {
  const [preview, setPreview] = useState(currentIconUrl || null);
  const [hover, setHover] = useState(false);
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef(null);

  useEffect(() => {
    // Clean up previous object URL if any
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (iconFile instanceof File) {
      const url = URL.createObjectURL(iconFile);
      objectUrlRef.current = url;
      setPreview(url);
    } else {
      setPreview(currentIconUrl || null);
    }
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [iconFile, currentIconUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setIconFile?.(file);
  };

  const openFileInput = () => {
    if (isEditable) fileInputRef.current?.click();
  };

  return (
    <div
      className={`relative ${isEditable ? "cursor-pointer group" : "cursor-default"}`}
      onMouseEnter={() => isEditable && setHover(true)}
      onMouseLeave={() => isEditable && setHover(false)}
      onClick={openFileInput}
    >
      {/* Clear button (visible when an icon is chosen or a current icon exists) */}
      {isEditable && (iconFile || currentIconUrl) && (
        <button
          type="button"
          aria-label="Remove avatar"
          title="Remove"
          className="absolute -top-2 -right-2 z-20 w-7 h-7 rounded-full bg-ancient-bg-dark/80 border border-ancient-border-stone text-ancient-text-light flex items-center justify-center shadow-md hover:bg-ancient-bg-dark"
          onClick={(e) => {
            e.stopPropagation();
            setIconFile?.(null);
            onClear?.();
            if (fileInputRef.current) fileInputRef.current.value = "";
            // preview will reset in effect
          }}
        >
          <IoClose className="text-base" />
        </button>
      )}
      {isEditable && !iconFile && !currentIconUrl && (
        <div className={`absolute inset-0 z-10 flex items-center justify-center flex-col text-center gap-1 rounded-full bg-ancient-bg-medium/80 backdrop-blur-sm border-2 border-ancient-icon-glow shadow-lg transition-opacity duration-300 ${hover ? "opacity-100 visible" : "opacity-0 invisible"}`}>
          <FaScroll className="text-4xl text-ancient-icon-glow drop-shadow-md" />
          <span className="text-ancient-text-light text-sm font-bold z-20">Upload Icon</span>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} hidden />
        </div>
      )}
      <div className="relative h-28 w-28 rounded-full overflow-hidden border-2 border-ancient-icon-glow flex items-center justify-center bg-ancient-input-bg shadow-lg">
        {preview ? (
          <Image key={preview} src={preview} alt={name || "Group Icon"} fill className="object-cover" unoptimized />
        ) : (
          <FaUsers className="text-ancient-text-muted/80 text-6xl" />
        )}
      </div>
    </div>
  );
}
