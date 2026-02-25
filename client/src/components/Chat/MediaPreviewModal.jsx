"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { IoAdd, IoClose, IoChevronBack, IoChevronForward, IoDocumentTextOutline, IoSend, IoFilmOutline } from "react-icons/io5";

export default function MediaPreviewModal({ open, onClose, files = [], context = 'any', onSend }) {
  const [index, setIndex] = useState(0);
  const [items, setItems] = useState(files || []);
  const [captions, setCaptions] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef(null);

  const current = items?.[index] || null;
  const url = useMemo(() => (current ? URL.createObjectURL(current) : null), [current]);

  // Handle SSR hydration
  useEffect(() => setMounted(true), []);

  // Clean initialization
  useEffect(() => {
    if (open) {
      setItems(files || []);
      setIndex(0);
      setIsSending(false);
    }
  }, [files, open]);

  // Manage captions array parallel scale
  useEffect(() => {
    setCaptions((prev) => {
      const next = [...prev];
      next.length = items.length;
      for (let i = 0; i < items.length; i++) {
        if (typeof next[i] !== "string") next[i] = "";
      }
      return next;
    });
  }, [items]);

  // Memory leak protection - revoke url on cycle
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  // Format bytes to human readable
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Add more files
  const handleAddMoreFiles = useCallback((e) => {
    const list = Array.from(e.target.files || []);
    if (list.length) {
      // Re-enforce strict context just in case OS file picker bypassed `accept`
      const valid = list.filter(f => {
        const mime = f.type || "";
        if (context === 'image') return mime.startsWith('image/');
        if (context === 'video') return mime.startsWith('video/');
        if (context === 'file') return !mime.startsWith('image/') && !mime.startsWith('video/');
        return true;
      });

      if (valid.length < list.length) {
        // ideally we would show a toast here, but dropping it silently is safer than crashing
        console.warn(`Dropped ${list.length - valid.length} files that violated the ${context} context.`);
      }

      const map = new Map();
      [...items, ...valid].forEach((f) => {
        map.set(`${f.name}-${f.size}-${f.type}`, f); // Dedupe
      });
      const merged = Array.from(map.values());
      setItems(merged);
      setIndex(merged.length - 1); // Move to newest
    }
    e.target.value = "";
  }, [items, context]);

  // Remove individual item
  const handleRemoveItem = useCallback((idxToRemove, ev) => {
    ev.stopPropagation();
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== idxToRemove);
      if (next.length === 0) {
        onClose(); // Auto-close if empty
      } else {
        const newIdx = Math.min(index, next.length - 1);
        setIndex(newIdx < 0 ? 0 : newIdx);
      }
      return next;
    });
    setCaptions((prev) => prev.filter((_, i) => i !== idxToRemove));
  }, [index, onClose]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing a caption
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      if (!open || items.length <= 1) return;
      if (e.key === "ArrowLeft") {
        setIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === "ArrowRight") {
        setIndex((prev) => (prev + 1) % items.length);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, items.length]);

  const handleSendAll = useCallback(() => {
    if (isSending) return; // Prevent double-clicks
    setIsSending(true);
    onSend?.({ files: items, captions });
  }, [items, captions, onSend, isSending]);

  // Require mounting for portal and open state
  if (!open || !mounted) return null;

  const isImage = current && current.type?.startsWith("image/");
  const isVideo = current && current.type?.startsWith("video/");

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#0b141a]/95 backdrop-blur-md animate-fade-in text-ancient-text-light">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-transparent shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/30 hover:bg-black/60 transition-colors"
            title="Cancel"
          >
            <IoClose className="text-2xl text-ancient-text-light" />
          </button>
          <span className="text-xl font-medium tracking-wide drop-shadow-md">
            {items.length === 0 ? "No media selected" : `Preview ${index + 1} of ${items.length}`}
          </span>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 border border-white/10 rounded-full shadow-md transition-colors"
          title="Add additional files"
        >
          <IoAdd className="text-xl" />
          <span className="font-semibold">Add File</span>
        </button>
      </div>

      {/* Hidden File Input matched dynamically to active context */}
      <input
        ref={inputRef}
        type="file"
        accept={context === 'image' ? 'image/*' : context === 'video' ? 'video/*' : '*'}
        multiple
        className="hidden"
        onChange={handleAddMoreFiles}
      />

      {/* Main Preview Container */}
      <div className="flex-1 overflow-hidden flex flex-col items-center justify-center p-4 relative">
        {items.length === 0 ? (
          <div className="flex flex-col items-center text-ancient-text-muted">
            <IoDocumentTextOutline className="text-6xl mb-4 opacity-50" />
            <p className="text-xl font-medium">No files attached</p>
          </div>
        ) : (
          <div className="relative flex items-center justify-center w-full h-full max-h-[65vh] sm:max-h-[75vh]">
            {isImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url || ""} alt={current?.name} className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-md" />
            )}
            {isVideo && (
              <video src={url || ""} controls className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-md" />
            )}
            {/* Non-Media File Display */}
            {!isImage && !isVideo && (
              <div className="flex flex-col items-center justify-center w-64 h-72 bg-ancient-bg-medium rounded-2xl border border-ancient-border-stone/50 drop-shadow-2xl shadow-xl transition-all">
                <div className="w-20 h-20 bg-ancient-bg-dark rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <IoDocumentTextOutline className="text-4xl text-ancient-icon-glow" />
                </div>
                <span className="text-[17px] font-medium truncate w-10/12 text-center text-ancient-text-light">{current?.name}</span>
                <span className="text-sm text-ancient-text-muted mt-2 font-semibold">
                  {formatBytes(current?.size)} • {(current?.name?.split('.').pop() || "FILE").toUpperCase()}
                </span>
              </div>
            )}

            {/* Navigation Flow Hints */}
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setIndex((prev) => (prev - 1 + items.length) % items.length)}
                  className="absolute left-2 sm:left-6 p-3 bg-black/50 hover:bg-black/80 rounded-full backdrop-blur-sm transition-all shadow-xl z-20"
                >
                  <IoChevronBack className="text-2xl" />
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((prev) => (prev + 1) % items.length)}
                  className="absolute right-2 sm:right-6 p-3 bg-black/50 hover:bg-black/80 rounded-full backdrop-blur-sm transition-all shadow-xl z-20"
                >
                  <IoChevronForward className="text-2xl" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer Area - Caption, Gallery, and Send */}
      {items.length > 0 && (
        <div className="shrink-0 pt-4 pb-6 bg-[#202c33]/95 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col items-center w-full z-50">

          {/* Caption Input */}
          <div className="w-full max-w-2xl px-4 relative mb-4">
            <input
              type="text"
              placeholder={isImage ? "Add a caption..." : "Add a file description..."}
              className="w-full bg-[#2a3942] border border-transparent focus:border-ancient-icon-glow text-white text-[15px] px-4 py-3 outline-none transition-all shadow-inner rounded-xl focus:bg-ancient-bg-dark"
              value={captions[index] || ""}
              onChange={(e) => {
                const v = e.target.value;
                setCaptions(prev => {
                  const next = [...prev];
                  next[index] = v;
                  return next;
                });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendAll();
              }}
            />
          </div>

          {/* Bottom Dock Control Row */}
          <div className="w-full relative flex items-center justify-center px-4">

            {/* Thumbnail Scroll Gallery */}
            <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pt-2 pb-4 px-1 max-w-[calc(100vw-120px)] sm:max-w-[70vw]">
              {items.map((f, i) => {
                const isImg = f.type?.startsWith("image/") || f.type?.startsWith("video/");
                const sel = i === index;
                const tnUrl = isImg ? URL.createObjectURL(f) : null;
                return (
                  <div key={`${f.name}-${i}`} className="relative group shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl shadow-md transition-all">
                    <button
                      type="button"
                      onClick={() => setIndex(i)}
                      className={`w-full h-full transform rounded-xl overflow-hidden transition-all duration-300 ${sel ? "ring-2 ring-ancient-icon-glow scale-100 opacity-100" : "opacity-50 hover:opacity-100 border-2 border-transparent scale-95"
                        }`}
                    >
                      {isImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        f.type.startsWith('video/') ? (
                          <div className="relative w-full h-full bg-black">
                            <video src={tnUrl} className="w-full h-full object-cover opacity-80" />
                            <IoFilmOutline className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/80 text-2xl drop-shadow-md" />
                          </div>
                        ) : (
                          <img src={tnUrl} alt="tn" className="w-full h-full object-cover" onLoad={() => URL.revokeObjectURL(tnUrl)} />
                        )
                      ) : (
                        <div className="w-full h-full bg-[#111b21] flex items-center justify-center">
                          <IoDocumentTextOutline className="text-2xl text-ancient-text-muted" />
                        </div>
                      )}
                    </button>
                    {/* Fixed X button placed absolutely INSIDE the div bounds */}
                    <button
                      type="button"
                      onClick={(ev) => handleRemoveItem(i, ev)}
                      className="absolute top-0 right-0 p-1 bg-black/60 hover:bg-red-500 rounded-bl-lg rounded-tr-xl text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"
                      title="Remove"
                    >
                      <IoClose size={12} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Send Control anchored reliably to the right */}
            <div className="absolute right-4 sm:right-8 bottom-3 sm:bottom-4">
              <button
                onClick={handleSendAll}
                disabled={isSending || items.length === 0}
                className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 shrink-0 bg-ancient-icon-glow hover:bg-green-500 text-ancient-bg-dark rounded-full shadow-xl transition-transform transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send Attachments"
              >
                <IoSend className="text-xl sm:text-2xl ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}