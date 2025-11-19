import Image from "next/image";
import React, { useState } from "react";
import { FaCamera } from "react-icons/fa";
import ContextMenu from "./ContextMenu";
import PhotoPicker from "./PhotoPicker";
import PhotoLibrary from "./PhotoLibrary";
import CapturePhoto from "./CapturePhoto";

function Avatar({ type, image, setImage }) {

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
    // reset input so same file can be selected again later
    e.target.value = "";
  };

  const contetMenuOptions = [
    { name: "Take Photo", callback: () => setShowCapture(true) },
    { name: "Chose from Library", callback: () => setShowLibrary(true) },
    { name: "Upload photo", callback: openUpload },
    { name: "Remove photo", callback: () => setImage("/default_avatar.png") },
  ];

  return (
    <>
      <div className="flex items-center justify-center">
        {type === "sm" && (
          <div className="relative h-10 w-10 cursor-pointer overflow-hidden rounded-full">
            <Image src={image || "/default_avatar.png"} alt="avatar" className="rounded-full" fill />
          </div>
        )}
        {type === "lg" && (
          <div className="relative h-14 w-14 cursor-pointer overflow-hidden rounded-full">
            <Image src={image || "/default_avatar.png"} alt="avatar" className="rounded-full" fill />
          </div>
        )}
        {type === "xl" && (
          <div className="relative cursor-pointer"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            <div className={`h-60 w-60 absolute top-0 left-0 z-10 flex items-center justify-center flex-col text-center gap-2 rounded-full bg-photo-picker-overlay-background/80
              ${hover ? "visible" : "hidden"}`}
              onClick={(e) => showContextMenu(e)}
            >
              <div className="absolute inset-0 rounded-full">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-28 bg-teal-800/80 rounded-t-full z-0"></div>
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-gray-300/50 rounded-full z-0"></div>
              </div>
              <FaCamera className="text-2xl z-20" id="context-opener"
                onClick={(e) => showContextMenu(e)}
              />
              <span className="z-20">Change <br /> profile <br /> photo</span>
            </div>
            <div className="relative z-0 h-60 w-60 flex items-center justify-center overflow-hidden rounded-full">
              <Image src={image || "/default_avatar.png"} alt="avatar" className="rounded-full" fill />
            </div>
          </div>
        )}
      </div>
      { isContextMenuVisible && (
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