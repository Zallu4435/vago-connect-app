import Image from "next/image";
import React, { useEffect, useState } from "react";
import { FaCamera, FaMagic, FaCircle, FaUserCircle, FaUsers } from "react-icons/fa";
import ContextMenu from "./ContextMenu";
import PhotoPicker from "./PhotoPicker";
import dynamic from "next/dynamic";

const PhotoLibrary = dynamic(() => import("./PhotoLibrary"), { ssr: false });
const CapturePhoto = dynamic(() => import("./CapturePhoto"), { ssr: false });

function Avatar({ type, image, setImage, defaultImage = "", isGroup = false }) {
  const [hover, setHover] = useState(false);
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const [contextMenuCoordinates, setContextMenuCoordinates] = useState({ x: 0, y: 0 });
  const [showLibrary, setShowLibrary] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
  const [src, setSrc] = useState(image || "");

  useEffect(() => {
    setSrc(image || "");
  }, [image]);

  const showContextMenu = (e) => {
    e.preventDefault();
    setIsContextMenuVisible(true);
    setContextMenuCoordinates({ x: e.pageX, y: e.pageY });
  };

  const openUpload = () => {
    const input = document.getElementById("photo-picker");
    if (input) input.click();
  };

  const onPhotoPicked = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") setImage(result);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // Reset input
  };

  const contextMenuOptions = [
    { name: "Take photo", callback: () => setShowCapture(true) },
    { name: "Choose from library", callback: () => setShowLibrary(true) },
    { name: "Upload photo", callback: openUpload },
    { name: "Reset to default", callback: () => setImage(defaultImage) },
  ];

  // Size variants adapt for all device sizes
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-14 w-14",
    lg: "h-20 w-20",
    xl: "h-44 w-44 sm:h-60 sm:w-60", // Responsive, limits on mobile!
  };

  const source = src || defaultImage || "";
  const hasImage = Boolean(source);

  return (
    <>
      <div className="flex items-center justify-center">
        {["sm", "lg", "md"].includes(type) && (
          <div
            className={`
              relative ${sizeClasses[type]} cursor-pointer overflow-hidden rounded-full
              border border-ancient-border-stone bg-ancient-input-bg flex items-center justify-center group
              transition-all
            `}
            tabIndex={0}
            aria-label="Change avatar"
            onClick={setImage ? showContextMenu : undefined}
            onContextMenu={setImage ? showContextMenu : undefined}
          >
            {hasImage ? (
              <Image
                src={source}
                alt="avatar"
                className="rounded-full object-cover"
                fill
                onError={() => setSrc("")}
                priority={type === "sm"}
              />
            ) : isGroup ? (
              <FaUsers className="text-ancient-text-muted/80 text-3xl sm:text-4xl" />
            ) : (
              <FaUserCircle className="text-ancient-text-muted/80 text-3xl sm:text-4xl" />
            )}
            {/* Subtle hover/touch effect (only if editable) */}
            {setImage && (
              <div className="
                absolute inset-0 bg-black/30 flex items-center justify-center
                opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300
              ">
                <FaCamera className="text-ancient-icon-glow text-lg sm:text-xl" />
              </div>
            )}
          </div>
        )}
        {type === "xl" && (
          <div
            className="relative group"
            tabIndex={0}
            aria-label="Change avatar"
            onClick={setImage ? showContextMenu : undefined}
            onContextMenu={setImage ? showContextMenu : undefined}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onFocus={() => setHover(true)}
            onBlur={() => setHover(false)}
          >
            {/* Overlay: always clickable for accessibility if setImage defined */}
            {setImage && (
              <button
                type="button"
                tabIndex={-1}
                className={`
                  absolute inset-0 z-10 flex items-center justify-center flex-col text-center gap-1
                  rounded-full bg-ancient-bg-medium/80 backdrop-blur-sm border-2 border-ancient-icon-glow shadow-lg
                  transition-opacity duration-300
                  ${hover ? "opacity-100 visible" : "opacity-0 invisible"}
                `}
                onClick={showContextMenu}
                aria-label="Change photo"
              >
                <FaCircle className="text-4xl sm:text-5xl text-ancient-icon-glow drop-shadow-md animate-pulse-light-slow" />
                <span className="text-ancient-text-light text-base sm:text-lg font-bold z-20 leading-tight">Change photo</span>
                <FaMagic className="hidden sm:block absolute bottom-3 right-4 text-2xl sm:text-4xl text-ancient-icon-glow opacity-80 animate-spin-slow-reverse" />
              </button>
            )}
            {/* Main Avatar Image */}
            <div className={`relative z-0 ${sizeClasses.xl} flex items-center justify-center overflow-hidden rounded-full border-4 border-ancient-icon-glow shadow-xl`}>
              {hasImage ? (
                <Image
                  src={source}
                  alt="avatar"
                  className="rounded-full object-cover"
                  fill
                  onError={() => setSrc("")}
                  priority={true}
                />
              ) : isGroup ? (
                <FaUsers className="text-ancient-text-muted/80 text-7xl sm:text-8xl md:text-9xl" />
              ) : (
                <FaUserCircle className="text-ancient-text-muted/80 text-7xl sm:text-8xl md:text-9xl" />
              )}
            </div>
          </div>
        )}
      </div>
      {/* Themed context menu (mobile tap/desktop right-click) */}
      {isContextMenuVisible && (
        <ContextMenu
          options={contextMenuOptions}
          cordinates={contextMenuCoordinates}
          contextMenu={isContextMenuVisible}
          setContextMenu={setIsContextMenuVisible}
        />
      )}
      {/* Hidden file input portal */}
      <PhotoPicker onChange={onPhotoPicked} />
      {/* Library modal */}
      {showLibrary && (
        <PhotoLibrary
          onSelect={(src) => { setImage(src); setShowLibrary(false); }}
          onClose={() => setShowLibrary(false)}
        />
      )}
      {/* Capture modal */}
      {showCapture && (
        <CapturePhoto
          onCapture={(dataUrl) => { setImage(dataUrl); setShowCapture(false); }}
          onClose={() => setShowCapture(false)}
        />
      )}
    </>
  );
}

export default Avatar;
