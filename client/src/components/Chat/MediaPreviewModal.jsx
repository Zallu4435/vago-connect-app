"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { IoAdd, IoClose, IoChevronBack, IoChevronForward, IoDocumentTextOutline, IoSend } from "react-icons/io5";
import ModalShell from "@/components/common/ModalShell";
import ModalHeader from "@/components/common/ModalHeader";

export default function MediaPreviewModal({ open, onClose, files = [], onSend }) {
  const [index, setIndex] = useState(0);
  const [items, setItems] = useState(files || []);
  const [captions, setCaptions] = useState([]);
  const inputRef = useRef(null); // For adding more files
  const current = items?.[index] || null;
  const url = useMemo(() => (current ? URL.createObjectURL(current) : null), [current]);

  // Reset items and index when modal opens or files prop changes
  useEffect(() => {
    setItems(files || []);
    setIndex(0);
  }, [files, open]);

  // Initialize/resize captions array based on items
  useEffect(() => {
    setCaptions((prev) => {
      const next = prev.slice();
      next.length = items.length; // Ensure length matches
      for (let i = 0; i < items.length; i++) {
        if (typeof next[i] !== 'string') next[i] = ""; // Fill new spots with empty string
      }
      return next;
    });
  }, [items]);

  // Revoke Object URL when current media changes or component unmounts
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  const isImage = current && current.type?.startsWith("image/");
  const isVideo = current && current.type?.startsWith("video/");

  // Handlers
  const handleAddMoreFiles = useCallback((e) => {
    const list = Array.from(e.target.files || []);
    if (list.length) {
      const map = new Map();
      [...items, ...list].forEach((f) => {
        map.set(`${f.name}-${f.size}-${f.type}`, f); // Use unique key for de-duplication
      });
      const merged = Array.from(map.values());
      setItems(merged);
      setIndex(merged.length - 1); // Select the last added item
    }
    e.target.value = ""; // Clear input for next selection
  }, [items]);

  const handleRemoveItem = useCallback((idxToRemove, ev) => {
    ev.stopPropagation(); // Prevent triggering parent button's onClick
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== idxToRemove); // Remove item at index
      const newIdx = Math.min(index, next.length - 1); // Adjust current index
      setIndex(newIdx < 0 ? 0 : newIdx); // Ensure index is valid
      if (next.length === 0) onClose(); // Close modal if no items left
      return next;
    });
    setCaptions((prev) => prev.filter((_, i) => i !== idxToRemove)); // Also remove caption
  }, [index, onClose]);

  const handleReorderItem = useCallback((idxToMove, direction, ev) => {
    ev.stopPropagation();
    setItems((prev) => {
      const next = prev.slice();
      const newIndex = direction === 'left' ? idxToMove - 1 : idxToMove + 1;
      if (newIndex < 0 || newIndex >= next.length) return prev; // Out of bounds

      // Swap items
      const temp = next[newIndex];
      next[newIndex] = next[idxToMove];
      next[idxToMove] = temp;

      setIndex(newIndex); // Update current index
      return next;
    });
    setCaptions((prev) => { // Swap captions as well
        const next = prev.slice();
        const newIndex = direction === 'left' ? idxToMove - 1 : idxToMove + 1;
        if (newIndex < 0 || newIndex >= next.length) return prev;

        const temp = next[newIndex];
        next[newIndex] = next[idxToMove];
        next[idxToMove] = temp;
        return next;
    });
  }, []);

  const handleCaptionChange = useCallback((e) => {
    const v = e.target.value;
    setCaptions((prev) => {
      const next = prev.slice();
      next[index] = v;
      return next;
    });
  }, [index]);

  const handleSendAll = useCallback(() => {
    onSend?.({ files: items, captions });
  }, [items, captions, onSend]);

  // Only guard after all hooks are declared
  if (!open) return null;


  return (
    <ModalShell open={open} onClose={onClose} maxWidth="max-w-4xl" ariaLabel="Media preview">
      <ModalHeader title="Preview" onClose={onClose} centerTitle />
      <div className="p-4 bg-ancient-bg-dark flex flex-col gap-4">
        {/* Main preview area */}
        <div className="relative w-full aspect-video flex items-center justify-center bg-ancient-input-bg rounded-xl overflow-hidden shadow-lg border border-ancient-input-border">
          {items.length === 0 ? (
             <div className="flex flex-col items-center gap-3 text-ancient-text-muted p-8">
                <IoDocumentTextOutline className="text-5xl" />
                <span className="text-xl font-semibold">No media selected</span>
                <span className="text-sm">Add images or videos to preview before sending.</span>
             </div>
          ) : (
            <>
              {isImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url || ""} alt="Preview" className="max-h-[70vh] w-auto h-full object-contain" />
              )}
              {isVideo && (
                <video src={url || ""} controls className="max-h-[70vh] w-auto h-full object-contain" />
              )}
              {!isImage && !isVideo && (
                <div className="text-ancient-text-muted p-8 text-center">
                  <IoDocumentTextOutline className="text-5xl mb-2" />
                  <p>Unsupported preview for this file.</p>
                </div>
              )}

              {/* Navigation Arrows for Multiple Items */}
              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-ancient-bg-dark/70 hover:bg-ancient-bg-dark rounded-full text-ancient-text-light text-2xl transition-colors shadow-md"
                    onClick={() => setIndex(prev => (prev - 1 + items.length) % items.length)}
                    title="Previous"
                    aria-label="Previous"
                  >
                    <IoChevronBack />
                  </button>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-ancient-bg-dark/70 hover:bg-ancient-bg-dark rounded-full text-ancient-text-light text-2xl transition-colors shadow-md"
                    onClick={() => setIndex(prev => (prev + 1) % items.length)}
                    title="Next"
                    aria-label="Next"
                  >
                    <IoChevronForward />
                  </button>
                </>
              )}
            </>
          )}

          {/* Add more button */}
          <button
            type="button"
            title="Add more"
            className="absolute top-4 right-4 px-4 py-2 rounded-lg bg-ancient-bubble-user hover:bg-ancient-bubble-user-light text-ancient-text-light text-sm font-semibold shadow-md flex items-center gap-2 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <IoAdd className="text-base" /> Add
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleAddMoreFiles}
          />
        </div>

        {/* Caption for current */}
        {items.length > 0 && (
            <div className="relative">
                <input
                    type="text"
                    placeholder="Add a caption (optional)"
                    className="w-full px-4 py-2 rounded-lg bg-ancient-input-bg border border-ancient-input-border text-ancient-text-light placeholder:text-ancient-text-muted focus:border-ancient-icon-glow focus:ring-1 focus:ring-ancient-icon-glow transition-all duration-200 shadow-sm"
                    value={captions[index] || ""}
                    onChange={handleCaptionChange}
                />
                {captions[index]?.length > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ancient-text-muted text-xs">
                        {captions[index].length}/200
                    </span>
                )}
            </div>
        )}

        {/* Thumbnails / Scroll Gallery */}
        {items.length > 0 && (
          <div className="mt-2 flex items-center gap-3 overflow-x-auto custom-scrollbar p-1">
            {items?.map((f, i) => {
              const u = URL.createObjectURL(f);
              const sel = i === index;
              const isImg = f.type?.startsWith("image/");
              return (
                <button
                  key={`${f.name}-${f.size}-${i}`} // Unique key
                  type="button"
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 group
                    ${sel ? "border-ancient-icon-glow ring-2 ring-ancient-icon-glow" : "border-ancient-border-stone hover:border-ancient-text-muted"}`}
                  onClick={() => setIndex(i)}
                  title={f.name}
                >
                  {isImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u} alt="thumb" className="w-full h-full object-cover" onLoad={() => URL.revokeObjectURL(u)} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-ancient-bg-medium text-ancient-text-muted text-xs">
                      <IoDocumentTextOutline className="text-xl" />
                    </div>
                  )}
                  {/* Remove */}
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-ancient-bg-dark text-ancient-text-light rounded-full w-6 h-6 flex items-center justify-center border border-ancient-border-stone"
                    title="Remove"
                    onClick={(ev) => handleRemoveItem(i, ev)}
                  >
                    <IoClose className="text-sm" />
                  </button>
                  {/* Reorder left/right */}
                  <div className="absolute bottom-1 left-1 right-1 flex justify-between gap-1">
                    <button
                      type="button"
                      className="px-1 py-0.5 text-xs bg-ancient-bg-dark/80 rounded border border-ancient-border-stone"
                      onClick={(ev) => handleReorderItem(i, 'left', ev)}
                    >
                      <IoChevronBack />
                    </button>
                    <button
                      type="button"
                      className="px-1 py-0.5 text-xs bg-ancient-bg-dark/80 rounded border border-ancient-border-stone"
                      onClick={(ev) => handleReorderItem(i, 'right', ev)}
                    >
                      <IoChevronForward />
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-ancient-border-stone/50">
          <button
            type="button"
            className="px-5 py-2.5 rounded-lg border border-ancient-input-border hover:bg-ancient-input-bg text-ancient-text-light font-semibold transition-colors shadow-md"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-5 py-2.5 rounded-lg bg-ancient-icon-glow hover:bg-green-500 text-ancient-bg-dark font-semibold transition-colors shadow-md flex items-center gap-2
              ${items.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={handleSendAll}
            disabled={items.length === 0}
          >
            <IoSend className="text-lg" /> Send ({items.length})
          </button>
        </div>
      </div>
    </ModalShell>
  );
}