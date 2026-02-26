"use client";
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  MdClose, MdAudiotrack, MdLocationOn, MdDescription,
  MdInsertDriveFile, MdChevronLeft, MdChevronRight,
  MdAutorenew, MdDownload,
} from "react-icons/md";
import { BsFillPlayFill, BsPauseFill } from "react-icons/bs";
import Image from "next/image";
import { useModalLock } from '@/hooks/ui/useModalLock';
import { getPortalRoot } from "@/utils/domHelpers";


export default function MediaCarouselView({
  mediaItems,
  initialIndex,
  onClose,
  onDownload,
  isDownloading,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex ?? 0);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [portalRoot, setPortalRoot] = useState(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  // Always lock while this component is mounted (it only renders when open)
  useModalLock(true);
  useEffect(() => setPortalRoot(getPortalRoot("modal-portal")), []);

  const currentMedia = useMemo(
    () => mediaItems[currentIndex],
    [mediaItems, currentIndex]
  );

  const isDocumentType =
    !String(currentMedia?.type || "").startsWith("image") &&
    !String(currentMedia?.type || "").startsWith("video") &&
    !String(currentMedia?.type || "").startsWith("audio");

  useEffect(() => {
    setMediaLoaded(isDocumentType);
    setIsPlaying(false);
    videoRef.current?.pause();
    audioRef.current?.pause();
  }, [currentMedia, isDocumentType]);

  const goToNext = useCallback(
    () => setCurrentIndex((p) => (p + 1) % mediaItems.length),
    [mediaItems.length]
  );
  const goToPrev = useCallback(
    () => setCurrentIndex((p) => (p - 1 + mediaItems.length) % mediaItems.length),
    [mediaItems.length]
  );

  const handleTogglePlay = useCallback(() => {
    if (currentMedia?.type?.startsWith("video") && videoRef.current) {
      if (videoRef.current.paused) videoRef.current.play();
      else videoRef.current.pause();
      setIsPlaying(!videoRef.current.paused);
    } else if (currentMedia?.type?.startsWith("audio") && audioRef.current) {
      if (audioRef.current.paused) audioRef.current.play();
      else audioRef.current.pause();
      setIsPlaying(!audioRef.current.paused);
    }
  }, [currentMedia?.type]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (mediaItems.length > 1) {
        if (e.key === "ArrowRight") goToNext();
        if (e.key === "ArrowLeft") goToPrev();
      }
      if (e.key === " " && (currentMedia?.type?.startsWith("video") || currentMedia?.type?.startsWith("audio"))) {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goToNext, goToPrev, onClose, currentMedia, mediaItems.length, handleTogglePlay]);

  const DisplayIcon = useMemo(() => {
    switch (currentMedia?.type) {
      case "audio": return MdAudiotrack;
      case "location": return MdLocationOn;
      case "document": return MdDescription;
      default: return MdInsertDriveFile;
    }
  }, [currentMedia?.type]);

  if (!currentMedia || !portalRoot) return null;

  const isImage = String(currentMedia.type).startsWith("image");
  const isVideo = String(currentMedia.type).startsWith("video");
  const isAudio = String(currentMedia.type).startsWith("audio");

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-ancient-bg-dark/98 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
    >
      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-ancient-bg-dark border-b border-ancient-border-stone/30">
        <div className="flex items-center gap-3 min-w-0">
          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-ancient-input-bg transition-colors text-ancient-text-muted hover:text-ancient-text-light active:scale-95"
            title="Close"
            aria-label="Close viewer"
          >
            <MdClose className="text-xl" />
          </button>
          {/* Title */}
          <div className="min-w-0">
            <div className="text-sm sm:text-[15px] font-semibold text-ancient-text-light truncate leading-tight">
              {currentMedia.fileName || "Media"}
            </div>
            <div className="text-[11px] text-ancient-text-muted">
              {new Date(currentMedia.createdAt).toLocaleString()}
              {mediaItems.length > 1 && (
                <span className="ml-2 text-ancient-icon-glow font-medium">
                  {currentIndex + 1} / {mediaItems.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Download */}
        {onDownload && (
          <button
            onClick={() => onDownload(currentMedia.mediaId)}
            disabled={isDownloading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ancient-input-bg hover:bg-ancient-input-border border border-ancient-border-stone/50 text-ancient-text-light text-sm transition-all active:scale-95 disabled:opacity-50"
            title="Download"
            aria-label="Download"
          >
            {isDownloading
              ? <MdAutorenew className="text-lg animate-spin text-ancient-icon-glow" />
              : <MdDownload className="text-lg text-ancient-icon-glow" />}
            <span className="hidden sm:inline text-[13px]">Download</span>
          </button>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden p-4">

        {/* Loading spinner */}
        {!mediaLoaded && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <MdAutorenew className="text-5xl text-ancient-icon-glow animate-spin opacity-70" />
          </div>
        )}

        {/* Prev button */}
        {mediaItems.length > 1 && (
          <button
            onClick={goToPrev}
            className="absolute left-2 sm:left-4 z-20 p-2 rounded-full bg-ancient-bg-dark/80 hover:bg-ancient-input-bg border border-ancient-border-stone/40 text-ancient-text-light backdrop-blur-sm transition-all active:scale-95 shadow-lg"
            title="Previous"
            aria-label="Previous media"
          >
            <MdChevronLeft className="text-3xl" />
          </button>
        )}

        {/* Media display */}
        <div className="relative flex items-center justify-center w-full h-full max-h-[calc(100vh-180px)]">
          {isImage && (
            <div className="relative w-full h-full">
              <Image
                src={currentMedia.url}
                alt={currentMedia.fileName || "Image"}
                fill
                className={`object-contain transition-opacity duration-300 ${mediaLoaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setMediaLoaded(true)}
                onError={() => setMediaLoaded(true)}
              />
            </div>
          )}

          {isVideo && (
            <video
              ref={videoRef}
              src={currentMedia.url}
              controls
              loop={false}
              onLoadedData={() => setMediaLoaded(true)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className={`rounded-xl shadow-2xl max-w-full max-h-full object-contain transition-opacity duration-300 ${mediaLoaded ? "opacity-100" : "opacity-0"}`}
            />
          )}

          {isAudio && (
            <div className={`flex flex-col items-center gap-8 transition-opacity duration-300 ${mediaLoaded ? "opacity-100" : "opacity-0"}`}>
              <div className={`w-[140px] h-[140px] rounded-full flex items-center justify-center bg-ancient-input-bg border-2 ${isPlaying ? "border-ancient-icon-glow" : "border-ancient-border-stone"} shadow-2xl transition-all`}>
                <MdAudiotrack className="text-6xl text-ancient-icon-glow" />
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
                className="w-16 h-16 rounded-full bg-ancient-icon-glow hover:brightness-110 text-ancient-bg-dark flex items-center justify-center shadow-lg transition-all active:scale-95"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying
                  ? <BsPauseFill className="text-3xl" />
                  : <BsFillPlayFill className="text-3xl ml-0.5" />}
              </button>
            </div>
          )}

          {!isImage && !isVideo && !isAudio && (
            <div className={`flex flex-col items-center gap-5 transition-opacity duration-300 ${mediaLoaded ? "opacity-100" : "opacity-0"}`}>
              <div className="w-24 h-24 rounded-2xl bg-ancient-input-bg border border-ancient-border-stone flex items-center justify-center shadow-xl">
                <DisplayIcon className="text-5xl text-ancient-icon-glow" />
              </div>
              <div className="text-center">
                <p className="text-ancient-text-light font-medium mb-1">{currentMedia.fileName}</p>
                <p className="text-ancient-text-muted text-sm">{(currentMedia.type || "file").toUpperCase()}</p>
              </div>
              {currentMedia.url && (
                <a
                  href={currentMedia.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-ancient-icon-glow text-ancient-bg-dark font-semibold text-sm hover:brightness-110 transition-all shadow"
                >
                  <MdDescription className="text-lg" />
                  Open File
                </a>
              )}
            </div>
          )}
        </div>

        {/* Next button */}
        {mediaItems.length > 1 && (
          <button
            onClick={goToNext}
            className="absolute right-2 sm:right-4 z-20 p-2 rounded-full bg-ancient-bg-dark/80 hover:bg-ancient-input-bg border border-ancient-border-stone/40 text-ancient-text-light backdrop-blur-sm transition-all active:scale-95 shadow-lg"
            title="Next"
            aria-label="Next media"
          >
            <MdChevronRight className="text-3xl" />
          </button>
        )}
      </div>

      {/* ── Footer: caption + thumbnails ── */}
      <div className="flex-shrink-0 bg-ancient-bg-dark border-t border-ancient-border-stone/30 px-4 pt-3 pb-4">
        {/* Caption */}
        {currentMedia.caption && (
          <p className="text-[13px] text-ancient-text-muted text-center mb-3 leading-snug max-w-2xl mx-auto">
            {currentMedia.caption}
          </p>
        )}

        {/* Thumbnail strip */}
        {mediaItems.length > 1 && (
          <div className="flex justify-center gap-2 overflow-x-auto custom-scrollbar py-1">
            {mediaItems.map((item, idx) => {
              const isImg = String(item.type).startsWith("image");
              const isVid = String(item.type).startsWith("video");
              const isSel = idx === currentIndex;
              return (
                <button
                  key={item.mediaId || idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden transition-all duration-200 border-2 ${isSel
                    ? "border-ancient-icon-glow scale-110 opacity-100 shadow-[0_0_0_1px_var(--ancient-icon-glow)]"
                    : "border-ancient-border-stone/50 opacity-50 hover:opacity-80 scale-95"
                    }`}
                  title={item.fileName || `Media ${idx + 1}`}
                  aria-label={`Go to media ${idx + 1}`}
                >
                  {isImg ? (
                    <Image src={item.url} alt="thumbnail" fill className="object-cover" />
                  ) : isVid ? (
                    <div className="relative w-full h-full bg-ancient-bg-medium">
                      <video src={item.url} className="w-full h-full object-cover opacity-70" preload="metadata" />
                      <BsFillPlayFill className="absolute inset-0 m-auto text-white text-lg drop-shadow" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-ancient-input-bg flex items-center justify-center">
                      <MdInsertDriveFile className="text-xl text-ancient-icon-glow" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    portalRoot
  );
}