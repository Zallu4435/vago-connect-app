"use client";
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { MdClose, MdAudiotrack, MdLocationOn, MdDescription, MdInsertDriveFile, MdChevronLeft, MdChevronRight, MdAutorenew, MdDownload } from "react-icons/md"; // Material icons
import { BsFillPlayFill, BsPauseFill } from "react-icons/bs"; // For audio/video controls
import Image from "next/image"; // For robust image display

export default function MediaCarouselView({ mediaItems, initialIndex, onClose, onDownload, isDownloading }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [mediaLoaded, setMediaLoaded] = useState(false); // State to track current media load
  const videoRef = useRef(null); // Ref for video playback control
  const audioRef = useRef(null); // Ref for audio playback control
  const [isPlaying, setIsPlaying] = useState(false); // For audio/video playback state

  const currentMedia = useMemo(() => mediaItems[currentIndex], [mediaItems, currentIndex]);

  const isDocumentType = !String(currentMedia.type).startsWith("image") && !String(currentMedia.type).startsWith("video") && !String(currentMedia.type).startsWith("audio");

  // Reset mediaLoaded state when currentMedia changes
  useEffect(() => {
    setMediaLoaded(isDocumentType); // Auto-load if it's a document (no load event)
    setIsPlaying(false); // Reset play state
    if (videoRef.current) videoRef.current.pause();
    if (audioRef.current) audioRef.current.pause();
  }, [currentMedia, isDocumentType]);

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

  // Dynamic icon based on media type for unsupported/document views
  const DisplayIcon = useMemo(() => {
    if (!currentMedia) return MdInsertDriveFile;
    switch (currentMedia.type) {
      case 'audio': return MdAudiotrack;
      case 'location': return MdLocationOn;
      case 'document': return MdDescription;
      default: return MdInsertDriveFile; // Generic file icon
    }
  }, [currentMedia?.type]);

  if (!currentMedia) return null;

  // Determine if it's a media type we can display directly or a file
  const isDirectlyDisplayable = String(currentMedia.type).startsWith("image") || String(currentMedia.type).startsWith("video") || String(currentMedia.type).startsWith("audio");

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 animate-fade-in backdrop-blur-sm">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent text-white z-[101]">
        <div className="flex flex-col">
          <h3 className="text-lg font-medium text-white/90 drop-shadow-md">{currentMedia.fileName || "Media"}</h3>
          <span className="text-xs text-white/60">{new Date(currentMedia.createdAt).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-3">
          {onDownload && (
            <button
              className="p-2 text-white/80 hover:text-white transition-colors duration-200"
              onClick={() => onDownload(currentMedia.mediaId)}
              title="Download"
              disabled={isDownloading}
            >
              {isDownloading ? (
                <MdAutorenew className="text-2xl drop-shadow-md animate-spin" />
              ) : (
                <MdDownload className="text-2xl drop-shadow-md" />
              )}
            </button>
          )}
          <button
            className="p-2 text-white/80 hover:text-white transition-colors duration-200"
            onClick={onClose}
            title="Close"
          >
            <MdClose className="text-2xl drop-shadow-md" />
          </button>
        </div>
      </div>

      {/* Main Media Content Area */}
      <div className="relative flex items-center justify-center flex-grow w-full h-full p-4 pt-24 pb-32">
        {!mediaLoaded && ( // Loading Spinner
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <MdAutorenew className="text-7xl text-ancient-icon-glow animate-spin" />
          </div>
        )}

        {/* Previous Button */}
        {mediaItems.length > 1 && (
          <button
            className="absolute left-2 sm:left-6 z-[101] p-2 text-white/50 hover:text-white transition-colors duration-200"
            onClick={goToPrev}
            title="Previous"
          >
            <MdChevronLeft className="text-5xl drop-shadow-lg" />
          </button>
        )}

        {/* Media Display */}
        <div className="relative flex items-center justify-center w-full h-full max-w-full max-h-full">
          {String(currentMedia.type).startsWith("image") && (
            <div className="relative w-full h-full">
              <Image
                src={currentMedia.url}
                alt={currentMedia.fileName || "Image"}
                fill
                className={`object-contain transition-opacity duration-300 ${mediaLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setMediaLoaded(true)}
                onError={() => setMediaLoaded(true)}
              />
            </div>
          )}
          {String(currentMedia.type).startsWith("video") && (
            <video
              ref={videoRef}
              src={currentMedia.url}
              controls
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
            <div className={`flex flex-col items-center justify-center gap-8 transition-opacity duration-300 ${mediaLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <div className={`flex items-center justify-center w-32 h-32 rounded-full border border-white/20 shadow-2xl backdrop-blur-md bg-white/5 ${isPlaying ? 'animate-pulse' : ''}`}>
                <MdAudiotrack className="text-5xl text-white/90" />
              </div>
              <audio
                ref={audioRef}
                src={currentMedia.url}
                controls={false}
                onLoadedData={() => setMediaLoaded(true)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
              <button
                onClick={handleTogglePlay}
                className="flex items-center justify-center w-16 h-16 rounded-full bg-white hover:bg-gray-200 text-black transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] focus:outline-none"
                aria-label={isPlaying ? "Pause audio" : "Play audio"}
              >
                {isPlaying ? <BsPauseFill className="text-3xl" /> : <BsFillPlayFill className="text-3xl ml-1" />}
              </button>
            </div>
          )}
          {!isDirectlyDisplayable && (
            <div className={`flex flex-col items-center justify-center gap-6 transition-opacity duration-300 ${mediaLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <DisplayIcon className="text-6xl text-white/80" />
              <div className="flex gap-4 mt-2">
                <a
                  href={currentMedia.url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-5 py-2 rounded-full border border-white/20 transition-all flex items-center gap-2 backdrop-blur-sm"
                >
                  <MdDescription className="text-lg" /> View File
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Next Button */}
        {mediaItems.length > 1 && (
          <button
            className="absolute right-2 sm:right-6 z-[101] p-2 text-white/50 hover:text-white transition-colors duration-200"
            onClick={goToNext}
            title="Next"
          >
            <MdChevronRight className="text-5xl drop-shadow-lg" />
          </button>
        )}
      </div>

      {/* Footer with Caption & Thumbnails */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 flex flex-col bg-gradient-to-t from-black via-black/80 to-transparent text-white z-[101]">
        {currentMedia.caption && (
          <p className="text-base text-center mb-4 leading-snug max-w-3xl mx-auto drop-shadow-md text-white/90">{currentMedia.caption}</p>
        )}

        {mediaItems.length > 1 && (
          <div className="flex justify-center gap-2 overflow-x-auto custom-scrollbar pt-2">
            {mediaItems.map((item, idx) => {
              const isImage = String(item.type).startsWith("image");
              const isVideo = String(item.type).startsWith("video");
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={item.id || idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative flex-shrink-0 w-12 h-12 rounded-md overflow-hidden transition-all duration-200
                    ${isSelected ? "ring-2 ring-white scale-110 z-10 opacity-100" : "opacity-50 hover:opacity-100"} `}
                  title={item.fileName || `Media ${idx + 1}`}
                >
                  {isImage ? (
                    <Image src={item.url} alt="thumbnail" fill className="object-cover" />
                  ) : isVideo ? (
                    <div className="relative w-full h-full bg-black">
                      <video src={item.url} className="w-full h-full object-cover opacity-80" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white/80">
                      <MdInsertDriveFile className="text-xl" />
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