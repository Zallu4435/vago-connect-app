/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useMemo, useState, memo } from "react";
import { MdImage, MdAudiotrack, MdVideocam, MdInsertDriveFile, MdLocationOn, MdAutorenew } from "react-icons/md";
import { FaDownload } from "react-icons/fa";

function MediaPreviewGridItem({ mediaItem, onSelect, onDownload, isDownloading }) {
  const [showOverlay, setShowOverlay] = useState(false);

  const typeString = String(mediaItem.type);
  const isImage = typeString.startsWith("image");
  const isVideo = typeString.startsWith("video");
  const isAudio = typeString.startsWith("audio");
  const isLocation = typeString.startsWith("location");
  const isDocOrLoc = !isImage && !isVideo && !isAudio;

  const Icon = useMemo(() => {
    if (isImage) return MdImage;
    if (isVideo) return MdVideocam;
    if (isAudio) return MdAudiotrack;
    if (isLocation) return MdLocationOn;
    return MdInsertDriveFile; // documents
  }, [isImage, isVideo, isAudio, isLocation]);

  return (
    <div
      className="group relative w-full h-36 bg-ancient-bg-dark rounded-md overflow-hidden cursor-pointer border border-ancient-border-stone hover:border-ancient-icon-glow transition-all duration-200"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
      onClick={() => onSelect(mediaItem)}
    >
      {isImage ? (
        <img
          src={mediaItem.thumbnailUrl || mediaItem.url}
          alt={mediaItem.fileName || mediaItem.type}
          loading="lazy"
          decoding="async"
          className="object-cover w-full h-full"
        />
      ) : isVideo ? (
        mediaItem.thumbnailUrl ? (
          <img
            src={mediaItem.thumbnailUrl}
            alt={mediaItem.fileName || "Video"}
            loading="lazy"
            decoding="async"
            className="object-cover w-full h-full"
          />
        ) : (
          <video src={mediaItem.url} className="object-cover w-full h-full" muted playsInline preload="metadata" />
        )
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full p-2 text-center text-ancient-text-muted text-sm bg-black/40">
          <Icon className="text-5xl text-white/70 mb-2 drop-shadow-md" />
          <span className="truncate w-full px-1 max-w-[90%] text-white/90 drop-shadow-md">{mediaItem.fileName || mediaItem.type}</span>
        </div>
      )}

      {(showOverlay || isVideo || isAudio) && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {isVideo && <MdVideocam className="text-white text-4xl opacity-70" />}
          {isAudio && <MdAudiotrack className="text-white text-4xl opacity-70" />}
          {isImage && <MdImage className="text-white text-4xl opacity-70" />}
          {isDocOrLoc && <MdInsertDriveFile className="text-white text-4xl opacity-70" />}

          <button
            className="absolute bottom-2 right-2 bg-ancient-bg-dark text-ancient-icon-glow rounded-full p-2 hover:bg-ancient-bubble-user-light shadow-lg"
            onClick={(e) => { e.stopPropagation(); onDownload(mediaItem.mediaId); }}
            title="Download"
            disabled={isDownloading}
          >
            {isDownloading ? <MdAutorenew className="text-sm animate-spin" /> : <FaDownload className="text-sm" />}
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(MediaPreviewGridItem);
