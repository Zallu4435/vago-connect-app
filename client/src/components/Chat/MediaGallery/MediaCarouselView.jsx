"use client";
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { MdClose, MdAudiotrack, MdLocationOn, MdDescription, MdInsertDriveFile, MdChevronLeft, MdChevronRight, MdAutorenew, MdDownload } from "react-icons/md"; // Material icons
import { BsFillPlayFill, BsPauseFill } from "react-icons/bs"; // For audio/video controls
import Image from "next/image"; // For robust image display

export default function MediaCarouselView({ mediaItems, initialIndex, onClose, onDownload }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [mediaLoaded, setMediaLoaded] = useState(false); // State to track current media load
  const videoRef = useRef(null); // Ref for video playback control
  const audioRef = useRef(null); // Ref for audio playback control
  const [isPlaying, setIsPlaying] = useState(false); // For audio/video playback state

  const currentMedia = useMemo(() => mediaItems[currentIndex], [mediaItems, currentIndex]);

  // Reset mediaLoaded state when currentMedia changes
  useEffect(() => {
    setMediaLoaded(false);
    setIsPlaying(false); // Reset play state
    if (videoRef.current) videoRef.current.pause();
    if (audioRef.current) audioRef.current.pause();
  }, [currentMedia]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  }, [mediaItems]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  }, [mediaItems]);

  const handleTogglePlay = useCallback(() => {
    if (currentMedia.type?.startsWith("video") && videoRef.current) {
      if (videoRef.current.paused) videoRef.current.play();
      else videoRef.current.pause();
      setIsPlaying(!videoRef.current.paused);
    } else if (currentMedia.type?.startsWith("audio") && audioRef.current) {
      if (audioRef.current.paused) audioRef.current.play();
      else audioRef.current.pause();
      setIsPlaying(!audioRef.current.paused);
    }
  }, [currentMedia.type]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (mediaItems.length > 1) { // Only navigate if there's more than one item
        if (e.key === 'ArrowRight') goToNext();
        else if (e.key === 'ArrowLeft') goToPrev();
      }
      if (e.key === 'Escape') onClose();
      // Add play/pause with spacebar (optional)
      if (e.key === ' ' && (currentMedia.type?.startsWith("video") || currentMedia.type?.startsWith("audio"))) {
        e.preventDefault(); // Prevent page scroll
        handleTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose, currentMedia, mediaItems.length, handleTogglePlay]);

  if (!currentMedia) return null;

  // Dynamic icon based on media type for unsupported/document views
  const DisplayIcon = useMemo(() => {
    switch (currentMedia.type) {
      case 'audio': return MdAudiotrack;
      case 'location': return MdLocationOn;
      case 'document': return MdDescription;
      default: return MdInsertDriveFile; // Generic file icon
    }
  }, [currentMedia.type]);

  // Determine if it's a media type we can display directly or a file
  const isDirectlyDisplayable = String(currentMedia.type).startsWith("image") || String(currentMedia.type).startsWith("video") || String(currentMedia.type).startsWith("audio");

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-ancient-bg-dark/80 text-ancient-text-light shadow-2xl z-[61] border-b border-ancient-border-stone/50">
        <h3 className="text-xl font-bold text-ancient-icon-glow">{currentMedia.fileName || "Media Preview"}</h3>
        <div className="flex items-center gap-4">
          {onDownload && (
            <button
              className="p-2 rounded-full bg-ancient-bg-medium/70 hover:bg-ancient-bubble-user-light text-ancient-text-light transition-colors duration-200 shadow-md"
              onClick={() => onDownload(currentMedia.mediaId)}
              title="Download Scroll"
              aria-label="Download Scroll"
            >
              <MdDownload className="text-2xl" />
            </button>
          )}
          <button
            className="p-2 rounded-full bg-red-700/70 hover:bg-red-600 text-white transition-colors duration-200 shadow-md"
            onClick={onClose}
            title="Banish Vision"
            aria-label="Close Media Viewer"
          >
            <MdClose className="text-2xl" />
          </button>
        </div>
      </div>

      {/* Main Media Content Area */}
      <div className="relative flex items-center justify-center flex-grow w-full h-full p-4">
        {!mediaLoaded && ( // Loading Spinner
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <MdAutorenew className="text-7xl text-ancient-icon-glow animate-spin" />
          </div>
        )}

        {/* Previous Button */}
        {mediaItems.length > 1 && (
          <button
            className="absolute left-6 z-[61] p-3 rounded-full bg-ancient-bg-dark/70 text-ancient-text-light hover:bg-ancient-bubble-user-light transition-colors duration-200 shadow-xl"
            onClick={goToPrev}
            title="Previous Enchantment"
            aria-label="Previous Enchantment"
          >
            <MdChevronLeft className="text-3xl" />
          </button>
        )}

        {/* Media Display */}
        <div className="flex items-center justify-center w-full h-full max-w-full max-h-full">
          {String(currentMedia.type).startsWith("image") && (
            <Image
              src={currentMedia.url}
              alt={currentMedia.fileName || "Image"}
              fill // Use fill for responsiveness
              className={`object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${mediaLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setMediaLoaded(true)}
              onError={() => setMediaLoaded(true)} // Still mark loaded even if error
            />
          )}
          {String(currentMedia.type).startsWith("video") && (
            <video
              ref={videoRef}
              src={currentMedia.url}
              controls={false} // Custom controls
              loop={false}
              onLoadedData={() => setMediaLoaded(true)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className={`object-contain max-w-full max-h-full rounded-lg shadow-2xl transition-opacity duration-300 ${mediaLoaded ? 'opacity-100' : 'opacity-0'}`}
            >
              Your browser does not support the video tag.
            </video>
          )}
          {String(currentMedia.type).startsWith("audio") && (
            <div className={`bg-ancient-bg-dark p-10 rounded-xl text-ancient-text-light flex flex-col items-center gap-6 border border-ancient-border-stone shadow-2xl transition-opacity duration-300 ${mediaLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <MdAudiotrack className="text-7xl text-ancient-icon-glow animate-pulse" />
              <p className="text-2xl font-semibold text-center max-w-xs">{currentMedia.fileName || "Voice Message"}</p>
              <audio
                ref={audioRef}
                src={currentMedia.url}
                controls={false} // Custom controls
                onLoadedData={() => setMediaLoaded(true)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              ></audio>
              <button
                onClick={handleTogglePlay}
                className="p-4 rounded-full bg-ancient-icon-glow text-ancient-bg-dark hover:bg-green-500 transition-colors shadow-lg"
                aria-label={isPlaying ? "Pause audio" : "Play audio"}
              >
                {isPlaying ? <BsPauseFill className="text-3xl" /> : <BsFillPlayFill className="text-3xl" />}
              </button>
            </div>
          )}
          {!isDirectlyDisplayable && ( // For documents, location, or other unsupported types
            <div className={`bg-ancient-bg-dark p-10 rounded-xl text-ancient-text-light flex flex-col items-center gap-6 border border-ancient-border-stone shadow-2xl transition-opacity duration-300 ${mediaLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <DisplayIcon className="text-7xl text-ancient-icon-glow" />
              <p className="text-2xl font-semibold text-center max-w-xs">{currentMedia.fileName || "Document"}</p>
              <p className="text-sm text-ancient-text-muted">Type: {currentMedia.type}</p>
              <a
                href={currentMedia.url}
                target="_blank"
                rel="noreferrer"
                className="bg-ancient-icon-glow hover:bg-green-500 text-ancient-bg-dark font-semibold px-6 py-3 rounded-lg shadow-md transition-colors duration-200 flex items-center gap-2"
              >
                <MdDescription className="text-xl" /> View Tome
              </a>
              <button
                className="mt-2 bg-blue-400 hover:bg-blue-500 text-gray-800 font-semibold px-4 py-2 rounded-lg shadow-md transition-colors duration-200"
                onClick={() => onDownload(currentMedia.mediaId)}
              >
                <MdDownload className="inline-block mr-2" /> Download Tome
              </button>
            </div>
          )}
        </div>

        {/* Next Button */}
        {mediaItems.length > 1 && (
          <button
            className="absolute right-6 z-[61] p-3 rounded-full bg-ancient-bg-dark/70 text-ancient-text-light hover:bg-ancient-bubble-user-light transition-colors duration-200 shadow-xl"
            onClick={goToNext}
            title="Next Enchantment"
            aria-label="Next Enchantment"
          >
            <MdChevronRight className="text-3xl" />
          </button>
        )}
      </div>

      {/* Footer with Caption & Thumbnails */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col bg-ancient-bg-dark/80 text-ancient-text-light shadow-2xl z-[61] border-t border-ancient-border-stone/50">
        {currentMedia.caption && (
          <p className="text-base text-center mb-2 leading-snug max-w-3xl mx-auto line-clamp-3">{currentMedia.caption}</p>
        )}
        <p className="text-xs text-ancient-text-muted text-center mb-4">{new Date(currentMedia.createdAt).toLocaleString()}</p>

        {mediaItems.length > 1 && (
          <div className="flex justify-center gap-2 overflow-x-auto custom-scrollbar pb-1">
            {mediaItems.map((item, idx) => {
              const isImage = item.type?.startsWith("image/");
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={item.id || idx} // Use a unique ID or index
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200
                    ${isSelected ? "border-ancient-icon-glow ring-2 ring-ancient-icon-glow" : "border-transparent hover:border-ancient-border-stone"}`}
                  title={item.fileName || `Media ${idx + 1}`}
                >
                  {isImage ? (
                    <Image src={item.url} alt="thumbnail" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-ancient-bg-medium text-ancient-text-muted text-xs">
                      <MdInsertDriveFile className="text-2xl text-ancient-icon-glow" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}