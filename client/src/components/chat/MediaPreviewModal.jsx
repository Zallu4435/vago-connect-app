"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  IoAdd, IoClose, IoChevronBack, IoChevronForward,
  IoDocumentTextOutline, IoSend, IoFilmOutline,
} from "react-icons/io5";
import { useModalLock } from '@/hooks/ui/useModalLock';
import { getPortalRoot } from "@/utils/domHelpers";
import { formatBytes } from "@/utils/messageHelpers";


export default function MediaPreviewModal({ open, onClose, files = [], context = "any", onSend }) {
  const [index, setIndex] = useState(0);
  const [items, setItems] = useState(files || []);
  const [captions, setCaptions] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [portalRoot, setPortalRoot] = useState(null);
  const inputRef = useRef(null);

  useModalLock(open);
  useEffect(() => setPortalRoot(getPortalRoot("modal-portal")), []);

  // Sync items when files prop changes
  useEffect(() => {
    if (open) {
      setItems(files || []);
      setIndex(0);
      setIsSending(false);
    }
  }, [files, open]);

  // Keep captions array in sync with items
  useEffect(() => {
    setCaptions((prev) => {
      const next = Array.from({ length: items.length }, (_, i) =>
        typeof prev[i] === "string" ? prev[i] : ""
      );
      return next;
    });
  }, [items]);

  // Revoke object URLs on cleanup
  const current = items?.[index] || null;
  const url = useMemo(() => (current ? URL.createObjectURL(current) : null), [current]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);


  // Add more files — blocked for video context (single only)
  const handleAddMoreFiles = useCallback(
    (e) => {
      const list = Array.from(e.target.files || []);
      if (!list.length) return;

      const valid = list.filter((f) => {
        const mime = f.type || "";
        if (context === "image") return mime.startsWith("image/");
        if (context === "video") return mime.startsWith("video/");
        if (context === "file") return !mime.startsWith("image/") && !mime.startsWith("video/");
        return true;
      });

      const map = new Map();
      [...items, ...valid].forEach((f) =>
        map.set(`${f.name}-${f.size}-${f.type}`, f)
      );
      const merged = Array.from(map.values());
      setItems(merged);
      setIndex(merged.length - 1);
      e.target.value = "";
    },
    [items, context]
  );

  // Remove a file
  const handleRemoveItem = useCallback(
    (idxToRemove, ev) => {
      ev.stopPropagation();
      setItems((prev) => {
        const next = prev.filter((_, i) => i !== idxToRemove);
        if (next.length === 0) onClose();
        else setIndex(Math.min(index, next.length - 1));
        return next;
      });
      setCaptions((prev) => prev.filter((_, i) => i !== idxToRemove));
    },
    [index, onClose]
  );

  // Keyboard nav
  useEffect(() => {
    const onKey = (e) => {
      if (!open || items.length <= 1) return;
      if (document.activeElement?.tagName === "INPUT") return;
      if (e.key === "ArrowLeft") setIndex((p) => (p - 1 + items.length) % items.length);
      if (e.key === "ArrowRight") setIndex((p) => (p + 1) % items.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, items.length]);

  const handleSendAll = useCallback(() => {
    if (isSending) return;
    setIsSending(true);
    onSend?.({ files: items, captions });
  }, [items, captions, onSend, isSending]);

  if (!open || !portalRoot) return null;

  const isImage = current?.type?.startsWith("image/");
  const isVideo = current?.type?.startsWith("video/");

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-ancient-bg-dark/98 backdrop-blur-md animate-fade-in text-ancient-text-light"
      role="dialog"
      aria-modal="true"
      aria-label="Send media preview"
    >
      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-ancient-border-stone/40 bg-ancient-bg-dark">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-ancient-input-bg border border-transparent hover:border-ancient-border-stone/40 text-ancient-text-muted hover:text-ancient-text-light transition-all active:scale-95"
            title="Cancel"
            aria-label="Cancel"
          >
            <IoClose className="text-xl" />
          </button>
          <div>
            <span className="text-[15px] font-semibold text-ancient-text-light">
              {items.length === 0 ? "No media" : `Send ${items.length} ${items.length === 1 ? "file" : "files"}`}
            </span>
            {items.length > 1 && (
              <span className="text-[11px] text-ancient-text-muted ml-2">
                ({index + 1} of {items.length})
              </span>
            )}
          </div>
        </div>

        {/* Add more files — hidden for video */}
        {context !== "video" && (
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ancient-input-bg hover:bg-ancient-input-border border border-ancient-border-stone/50 text-ancient-text-light text-sm transition-all active:scale-95"
            title="Add more files"
          >
            <IoAdd className="text-base" />
            <span className="font-medium text-[13px]">Add</span>
          </button>
        )}

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept={
            context === "image" ? "image/*" :
              context === "video" ? "video/*" : "*"
          }
          multiple={context !== "video"}
          className="hidden"
          onChange={handleAddMoreFiles}
        />
      </div>

      {/* ── Main preview ── */}
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        {items.length === 0 ? (
          <div className="flex flex-col items-center text-ancient-text-muted gap-3">
            <IoDocumentTextOutline className="text-6xl opacity-40" />
            <span className="text-base">No files selected</span>
          </div>
        ) : (
          <div className="relative flex items-center justify-center w-full h-full max-h-[65vh] sm:max-h-[72vh]">
            {isImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url || ""}
                alt={current?.name}
                className="max-w-full max-h-full object-contain rounded-xl drop-shadow-2xl"
              />
            )}
            {isVideo && (
              <video
                src={url || ""}
                controls
                className="max-w-full max-h-full object-contain rounded-xl drop-shadow-2xl"
              />
            )}
            {!isImage && !isVideo && (
              <div className="flex flex-col items-center justify-center w-64 bg-ancient-bg-medium border border-ancient-border-stone rounded-2xl p-8 shadow-2xl gap-4">
                <div className="w-16 h-16 bg-ancient-input-bg rounded-xl flex items-center justify-center">
                  <IoDocumentTextOutline className="text-4xl text-ancient-icon-glow" />
                </div>
                <div className="text-center">
                  <p className="text-[15px] font-semibold text-ancient-text-light truncate max-w-[200px]">
                    {current?.name}
                  </p>
                  <p className="text-[12px] text-ancient-text-muted mt-1">
                    {formatBytes(current?.size)}
                    {current?.name?.includes(".") && (
                      <span className="ml-1 font-bold text-ancient-icon-glow">
                        .{current.name.split(".").pop().toUpperCase()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Prev / Next navigation */}
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setIndex((p) => (p - 1 + items.length) % items.length)}
                  className="absolute left-2 sm:left-4 p-2 rounded-full bg-ancient-bg-dark/80 hover:bg-ancient-input-bg border border-ancient-border-stone/40 backdrop-blur-sm transition-all active:scale-95 shadow-lg"
                  aria-label="Previous"
                >
                  <IoChevronBack className="text-xl text-ancient-text-light" />
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((p) => (p + 1) % items.length)}
                  className="absolute right-2 sm:right-4 p-2 rounded-full bg-ancient-bg-dark/80 hover:bg-ancient-input-bg border border-ancient-border-stone/40 backdrop-blur-sm transition-all active:scale-95 shadow-lg"
                  aria-label="Next"
                >
                  <IoChevronForward className="text-xl text-ancient-text-light" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Footer: caption + thumbnail strip + send ── */}
      {items.length > 0 && (
        <div className="flex-shrink-0 border-t border-ancient-border-stone/40 bg-ancient-bg-medium px-4 pt-3 pb-5">
          {/* Caption input */}
          <div className="w-full max-w-2xl mx-auto mb-4">
            <input
              type="text"
              placeholder={isImage ? "Add a caption…" : isVideo ? "Add a description…" : "Add a note…"}
              className="w-full bg-ancient-input-bg border border-ancient-input-border focus:border-ancient-icon-glow rounded-xl px-4 py-2.5 text-[14px] text-ancient-text-light placeholder:text-ancient-text-muted outline-none transition-all"
              value={captions[index] || ""}
              onChange={(e) =>
                setCaptions((prev) => {
                  const next = [...prev];
                  next[index] = e.target.value;
                  return next;
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendAll();
              }}
            />
          </div>

          {/* Thumbnail row + send button */}
          <div className="relative flex items-center justify-center">
            {/* Thumbnails */}
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-1 max-w-[calc(100vw-100px)] sm:max-w-[70vw]">
              {items.map((f, i) => {
                const isImg = f.type?.startsWith("image/");
                const isVid = f.type?.startsWith("video/");
                const isSel = i === index;
                const tnUrl = (isImg || isVid) ? URL.createObjectURL(f) : null;
                return (
                  <div
                    key={`${f.name}-${i}`}
                    className="relative group flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16"
                  >
                    <button
                      type="button"
                      onClick={() => setIndex(i)}
                      className={`w-full h-full rounded-xl overflow-hidden border-2 transition-all duration-200 ${isSel
                        ? "border-ancient-icon-glow scale-100 opacity-100 shadow-[0_0_0_2px_var(--ancient-icon-glow)]"
                        : "border-ancient-border-stone/40 opacity-50 hover:opacity-80 scale-95"
                        }`}
                    >
                      {tnUrl ? (
                        isVid ? (
                          <div className="relative w-full h-full bg-ancient-bg-dark">
                            <video src={tnUrl} className="w-full h-full object-cover opacity-75" preload="metadata" />
                            <IoFilmOutline className="absolute inset-0 m-auto text-white/80 text-xl drop-shadow" />
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={tnUrl}
                            alt="thumbnail"
                            className="w-full h-full object-cover"
                            onLoad={() => URL.revokeObjectURL(tnUrl)}
                          />
                        )
                      ) : (
                        <div className="w-full h-full bg-ancient-input-bg flex items-center justify-center">
                          <IoDocumentTextOutline className="text-2xl text-ancient-icon-glow" />
                        </div>
                      )}
                    </button>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={(ev) => handleRemoveItem(i, ev)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-ancient-bg-dark border border-ancient-border-stone rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:border-red-500 z-10 shadow"
                      title="Remove"
                      aria-label="Remove file"
                    >
                      <IoClose size={10} className="text-white" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Send button — anchored right */}
            <div className="absolute right-0 bottom-0">
              <button
                onClick={handleSendAll}
                disabled={isSending || items.length === 0}
                className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full bg-ancient-icon-glow hover:brightness-110 text-ancient-bg-dark shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send"
                aria-label="Send files"
              >
                <IoSend className="text-xl ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, portalRoot);
}