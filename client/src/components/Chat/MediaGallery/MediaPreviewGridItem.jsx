"use client";
import React, { useMemo, useState } from "react";
import { MdImage, MdAudiotrack, MdVideocam, MdInsertDriveFile, MdLocationOn } from "react-icons/md";
import { FaDownload } from "react-icons/fa";

export default function MediaPreviewGridItem({ mediaItem, onSelect, onDownload }) {
  const [showOverlay, setShowOverlay] = useState(false);
  const Icon = useMemo(() => {
    switch (mediaItem.type) {
      case 'image': return MdImage;
      case 'video': return MdVideocam;
      case 'audio': return MdAudiotrack;
      case 'location': return MdLocationOn;
      default: return MdInsertDriveFile; // documents
    }
  }, [mediaItem.type]);

  return (
    <div
      className="group relative w-full h-36 bg-ancient-bg-dark rounded-md overflow-hidden cursor-pointer border border-ancient-border-stone hover:border-ancient-icon-glow transition-all duration-200"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
      onClick={() => onSelect(mediaItem)}
    >
      {String(mediaItem.type).startsWith("image") || String(mediaItem.type).startsWith("video") ? (
        <img
          src={mediaItem.thumbnailUrl || mediaItem.url}
          alt={mediaItem.fileName || mediaItem.type}
          className="object-cover w-full h-full"
        />
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full p-2 text-center text-ancient-text-muted text-sm">
          <Icon className="text-4xl text-ancient-icon-inactive mb-2" />
          <span className="truncate w-full px-1">{mediaItem.fileName || mediaItem.type}</span>
        </div>
      )}

      {(showOverlay || String(mediaItem.type).startsWith("video") || String(mediaItem.type).startsWith("audio")) && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {String(mediaItem.type).startsWith("video") && (
            <MdVideocam className="text-white text-4xl opacity-70" />
          )}
          {String(mediaItem.type).startsWith("audio") && (
            <MdAudiotrack className="text-white text-4xl opacity-70" />
          )}
          {String(mediaItem.type).startsWith("image") && (
             <MdImage className="text-white text-4xl opacity-70" />
          )}
          {(String(mediaItem.type).startsWith("document") || String(mediaItem.type).startsWith("location")) && (
             <MdInsertDriveFile className="text-white text-4xl opacity-70" />
          )}

          <button
            className="absolute bottom-2 right-2 bg-ancient-bg-dark text-ancient-icon-glow rounded-full p-2 hover:bg-ancient-bubble-user-light shadow-lg"
            onClick={(e) => { e.stopPropagation(); onDownload(mediaItem.mediaId); }}
            title="Download"
          >
            <FaDownload className="text-sm" />
          </button>
        </div>
      )}
    </div>
  );
}
