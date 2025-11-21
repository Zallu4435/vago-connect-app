"use client";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { MdClose, MdAudiotrack, MdInsertDriveFile, MdLocationOn } from "react-icons/md";
import { FaChevronLeft, FaChevronRight, FaDownload } from "react-icons/fa";

export default function MediaCarouselView({ mediaItems, initialIndex, onClose, onDownload }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentMedia = useMemo(() => mediaItems[currentIndex], [mediaItems, currentIndex]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  }, [mediaItems]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  }, [mediaItems]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') goToNext();
      else if (e.key === 'ArrowLeft') goToPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose]);

  if (!currentMedia) return null;

  const Icon = useMemo(() => {
    switch (currentMedia.type) {
      case 'audio': return MdAudiotrack;
      case 'location': return MdLocationOn;
      default: return MdInsertDriveFile;
    }
  }, [currentMedia.type]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center animate-fade-in">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-black/50 text-ancient-text-light shadow-lg z-[61]">
        <h3 className="text-lg font-semibold">{currentMedia.fileName || "Media"}</h3>
        <button className="text-ancient-icon-glow hover:text-red-400 transition-colors duration-200" onClick={onClose} title="Close">
          <MdClose className="text-3xl" />
        </button>
      </div>

      {/* Media Content */}
      <div className="relative flex items-center justify-center flex-grow w-full h-full">
        {mediaItems.length > 1 && (
          <button
            className="absolute left-4 z-[61] bg-ancient-bg-medium/70 text-ancient-icon-glow p-3 rounded-full hover:bg-ancient-bubble-user-light transition-colors duration-200 shadow-xl"
            onClick={goToPrev}
            title="Previous"
          >
            <FaChevronLeft className="text-2xl" />
          </button>
        )}

        <div className="max-w-[80vw] max-h-[80vh] flex items-center justify-center">
          {String(currentMedia.type).startsWith("image") && (
            <img src={currentMedia.url} alt={currentMedia.fileName} className="object-contain max-w-full max-h-full rounded-lg shadow-2xl border border-ancient-border-stone" />
          )}
          {String(currentMedia.type).startsWith("video") && (
            <video controls src={currentMedia.url} className="object-contain max-w-full max-h-full rounded-lg shadow-2xl border border-ancient-border-stone"></video>
          )}
          {String(currentMedia.type).startsWith("audio") && (
            <div className="bg-ancient-bg-dark p-8 rounded-lg text-ancient-text-light flex flex-col items-center gap-4 border border-ancient-border-stone shadow-2xl">
              <Icon className="text-6xl text-ancient-icon-glow" />
              <p className="text-xl font-semibold">{currentMedia.fileName || "Audio"}</p>
              <audio controls src={currentMedia.url} className="w-full"></audio>
            </div>
          )}
          {(String(currentMedia.type).startsWith("document") || String(currentMedia.type).startsWith("location")) && (
            <div className="bg-ancient-bg-dark p-8 rounded-lg text-ancient-text-light flex flex-col items-center gap-4 border border-ancient-border-stone shadow-2xl">
              <Icon className="text-6xl text-ancient-icon-glow" />
              <p className="text-xl font-semibold">{currentMedia.fileName || "Document"}</p>
              <a
                href={currentMedia.url}
                target="_blank"
                rel="noreferrer"
                className="bg-ancient-icon-glow hover:bg-ancient-bubble-user-light text-ancient-bg-dark font-semibold px-6 py-3 rounded-lg shadow-md transition-colors duration-200"
              >
                View
              </a>
            </div>
          )}
        </div>

        {mediaItems.length > 1 && (
          <button
            className="absolute right-4 z-[61] bg-ancient-bg-medium/70 text-ancient-icon-glow p-3 rounded-full hover:bg-ancient-bubble-user-light transition-colors duration-200 shadow-xl"
            onClick={goToNext}
            title="Next"
          >
            <FaChevronRight className="text-2xl" />
          </button>
        )}
      </div>

      {/* Footer with optional caption */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between bg-black/50 text-ancient-text-light shadow-lg z-[61]">
        <div className="max-w-[70%]">
          {currentMedia.caption && (
            <p className="text-sm mb-1 leading-snug line-clamp-2">{currentMedia.caption}</p>
          )}
          <p className="text-xs text-ancient-text-muted">{new Date(currentMedia.createdAt).toLocaleString()}</p>
        </div>
        <button
          className="bg-blue-400 hover:bg-blue-500 text-gray-800 font-semibold px-4 py-2 rounded-lg shadow-md transition-colors duration-200"
          onClick={() => onDownload(currentMedia.mediaId)}
        >
          <FaDownload className="inline-block mr-2" /> Download
        </button>
      </div>
    </div>
  );
}
