"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FaUserCircle, FaScroll } from "react-icons/fa";

export default function AvatarUpload({ iconFile, setIconFile, name, defaultImage = "/default_mystical_avatar.png", currentIconUrl, isEditable = true }) {
  const [preview, setPreview] = useState(currentIconUrl || defaultImage);
  const [hover, setHover] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (iconFile) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(iconFile);
    } else {
      setPreview(currentIconUrl || defaultImage);
    }
  }, [iconFile, currentIconUrl, defaultImage]);

  const handleFileChange = (e) => {
    setIconFile?.(e.target.files?.[0] || null);
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
      {isEditable && (
        <div className={`absolute inset-0 z-10 flex items-center justify-center flex-col text-center gap-1 rounded-full bg-ancient-bg-medium/80 backdrop-blur-sm border-2 border-ancient-icon-glow shadow-lg transition-opacity duration-300 ${hover ? "opacity-100 visible" : "opacity-0 invisible"}`}>
          <FaScroll className="text-4xl text-ancient-icon-glow drop-shadow-md" />
          <span className="text-ancient-text-light text-sm font-bold z-20">Upload\nIcon</span>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} hidden />
        </div>
      )}
      <div className="relative h-28 w-28 rounded-full overflow-hidden border-2 border-ancient-icon-glow flex items-center justify-center bg-ancient-input-bg shadow-lg">
        <Image src={preview} alt={name || "Group Icon"} fill className="object-cover" />
        {!iconFile && !currentIconUrl && <FaUserCircle className="absolute text-5xl text-ancient-text-muted opacity-70" />}
      </div>
    </div>
  );
}
