import React from "react";
import { FaCamera, FaLocationArrow } from "react-icons/fa";
import { IoVideocam } from "react-icons/io5";
import { MdInsertDriveFile } from "react-icons/md";
import { BsEmojiSmile } from "react-icons/bs";

function AttachmentDropdown({ onImage, onVideo, onFile, onLocation, onEmoji }) {
  return (
    <div className="absolute bottom-14 left-0 z-50 bg-ancient-bg-dark border border-ancient-border-stone rounded-lg shadow-xl p-2 w-52 animate-fade-in-up">
      <button
        className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-ancient-bubble-user text-ancient-text-light text-sm rounded-md transition-colors duration-200"
        onClick={onImage}
      >
        <FaCamera className="text-ancient-icon-glow text-base" />
        <span>Invoke Image</span>
      </button>
      <button
        className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-ancient-bubble-user text-ancient-text-light text-sm rounded-md transition-colors duration-200"
        onClick={onVideo}
      >
        <IoVideocam className="text-ancient-icon-glow text-base" />
        <span>Conjure Video</span>
      </button>
      <button
        className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-ancient-bubble-user text-ancient-text-light text-sm rounded-md transition-colors duration-200"
        onClick={onFile}
      >
        <MdInsertDriveFile className="text-ancient-icon-glow text-base" />
        <span>Transcribe File</span>
      </button>
      <button
        className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-ancient-bubble-user text-ancient-text-light text-sm rounded-md transition-colors duration-200"
        onClick={onLocation}
      >
        <FaLocationArrow className="text-ancient-icon-glow text-base" />
        <span>Divine Location</span>
      </button>
      <button
        className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-ancient-bubble-user text-ancient-text-light text-sm rounded-md transition-colors duration-200"
        onClick={onEmoji}
      >
        <BsEmojiSmile className="text-ancient-icon-glow text-base" />
        <span>Invoke Glyph</span>
      </button>
    </div>
  );
}

export default AttachmentDropdown;
