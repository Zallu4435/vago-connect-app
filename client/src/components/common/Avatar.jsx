import Image from "next/image";
import React, { useState } from "react";
import { FaCamera, FaMagic, FaCircle, FaUserCircle } from "react-icons/fa"; // Reliable icons
import ContextMenu from "./ContextMenu"; // These will also need thematic updates
import PhotoPicker from "./PhotoPicker"; // These will also need thematic updates
import PhotoLibrary from "./PhotoLibrary"; // These will also need thematic updates
import CapturePhoto from "./CapturePhoto"; // These will also need thematic updates

function Avatar({ type, image, setImage, defaultImage = "/default_mystical_avatar.png" }) { // Added defaultImage prop
  const [hover, setHover] = useState(false);
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const [contextMenuCoordinates, setContextMenuCoordinates] = useState({ x: 0, y: 0 });
  const [showLibrary, setShowLibrary] = useState(false);
  const [showCapture, setShowCapture] = useState(false);

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

  const contetMenuOptions = [
    { name: "Scry from Orb (Take Photo)", callback: () => setShowCapture(true) }, // Themed
    { name: "Consult Ancient Archives (Choose from Library)", callback: () => setShowLibrary(true) }, // Themed
    { name: "Channel New Visage (Upload photo)", callback: openUpload }, // Themed
    { name: "Revert to Default Aspect", callback: () => setImage(defaultImage) }, // Themed, uses defaultImage
  ];

  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-14 w-14",
    lg: "h-20 w-20",
    xl: "h-60 w-60",
  };

  return (
    <>
      <div className="flex items-center justify-center">
        {["sm", "lg"].includes(type) && (
          <div className={`relative ${sizeClasses[type]} cursor-pointer overflow-hidden rounded-full border border-ancient-border-stone bg-ancient-input-bg flex items-center justify-center group`}>
            <Image src={image || defaultImage} alt="avatar" className="rounded-full object-cover" fill />
            {/* Subtle hover effect for smaller avatars */}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <FaCamera className="text-ancient-icon-glow text-xl" />
            </div>
          </div>
        )}
        {type === "xl" && (
          <div
            className="relative cursor-pointer group"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            {/* Overlay for large avatar */}
            <div
              className={`absolute inset-0 z-10 flex items-center justify-center flex-col text-center gap-2 rounded-full bg-ancient-bg-medium/80 backdrop-blur-sm border-2 border-ancient-icon-glow shadow-lg transition-opacity duration-300
                ${hover ? "opacity-100 visible" : "opacity-0 invisible"}`} // Smooth fade in/out
              onClick={(e) => showContextMenu(e)}
            >
              <FaCircle className="text-5xl text-ancient-icon-glow drop-shadow-md animate-pulse-light-slow" /> {/* Themed icon */}
              <span className="text-ancient-text-light text-lg font-bold z-20">
                Change <br /> Ethereal Visage
              </span>
              <FaMagic className="absolute bottom-4 right-4 text-4xl text-ancient-icon-glow opacity-80 animate-spin-slow-reverse" />
            </div>
            {/* Main Avatar Image */}
            <div className={`relative z-0 ${sizeClasses.xl} flex items-center justify-center overflow-hidden rounded-full border-4 border-ancient-icon-glow shadow-xl`}>
              <Image src={image || defaultImage} alt="avatar" className="rounded-full object-cover" fill />
            </div>
          </div>
        )}
      </div>
      {isContextMenuVisible && (
        <ContextMenu
          options={contetMenuOptions}
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