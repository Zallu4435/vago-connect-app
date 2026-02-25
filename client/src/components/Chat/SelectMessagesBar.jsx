"use client";
import React, { useState, useCallback, useRef } from "react";
import ActionSheet from "@/components/common/ActionSheet"; // Assuming ActionSheet is also themed
import { MdClose, MdSelectAll, MdMoreHoriz, MdContentCopy, MdDeleteOutline, MdForward } from "react-icons/md";

function SelectMessagesBar({
  selectMode,
  selectedCount = 0,
  onToggleSelect, // Initiates select mode
  onCancel,     // Cancels select mode
  onForward,
  onDelete,     // Added delete functionality for completeness
  onCopy,       // Added copy functionality for completeness
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const actionsBtnRef = useRef(null);

  // Unified handler for toggling/cancelling selection
  const handleToggleOrCancel = useCallback(() => {
    if (selectMode) {
      onCancel?.();
    } else {
      onToggleSelect?.();
    }
  }, [selectMode, onCancel, onToggleSelect]);

  const handleForward = useCallback(() => {
    setSheetOpen(false);
    onForward?.();
  }, [onForward]);

  const handleDelete = useCallback(() => {
    setSheetOpen(false);
    onDelete?.(); // Call the delete handler
  }, [onDelete]);

  const handleCopy = useCallback(() => {
    setSheetOpen(false);
    onCopy?.(); // Call the copy handler
  }, [onCopy]);

  return (
    // Outer container for sticky positioning and full width
    <div className="sticky top-0 z-20 w-full px-3 sm:px-4 py-2 pointer-events-none">
      {/* Inner bar container - dynamic width and thematic styling */}
      <div
        className={`
          flex items-center ${selectMode ? "justify-between" : "justify-start"} pointer-events-auto
          bg-ancient-bg-medium border border-ancient-border-stone
          rounded-full px-4 sm:px-5 py-2 shadow-2xl transition-all duration-300 ease-in-out
          mx-auto backdrop-blur-sm
          ${selectMode ? "w-full md:w-3/4 lg:w-2/3 max-w-2xl" : "w-fit"}
        `}
      >
        {/* Left-most button: Toggle/Cancel Selection */}
        <button
          className={`
            flex items-center gap-2
            text-sm md:text-base whitespace-nowrap
            px-3 py-1.5 rounded-full transition-colors duration-200
            ${selectMode
              ? "text-red-400 hover:bg-ancient-input-bg" // Red for cancel
              : "text-ancient-text-light hover:bg-ancient-input-bg"} // White for select
          `}
          onClick={handleToggleOrCancel}
          type="button"
          aria-label={selectMode ? "Cancel Message Selection" : "Initiate Message Selection"}
        >
          {selectMode ? (
            <MdClose className="text-xl md:text-2xl" />
          ) : (
            <MdSelectAll className="text-xl md:text-2xl text-ancient-icon-glow" />
          )}
          <span className="font-semibold">
            {selectMode ? "Cancel Selection" : "Select Messages"}
          </span>
        </button>

        {selectMode && (
          <>
            {/* Selected Count */}
            <span className="flex-1 text-center text-ancient-text-muted text-xs md:text-sm whitespace-nowrap min-w-0 px-2">
              <span className="font-bold text-ancient-icon-glow">{selectedCount}</span> <span className="hidden sm:inline">selected</span>
            </span>

            {/* Actions Button */}
            <button
              ref={actionsBtnRef}
              className={`
                flex items-center gap-2
                bg-ancient-icon-glow hover:bg-green-500
                text-ancient-bg-dark text-xs md:text-sm
                px-4 py-2 rounded-full
                disabled:opacity-50 transition-colors duration-200
                font-bold shadow-lg
                whitespace-nowrap
              `}
              disabled={selectedCount === 0}
              onClick={() => setSheetOpen(true)}
              type="button"
              aria-label="More Actions for Selected Messages"
            >
              <MdMoreHoriz className="text-lg md:text-xl" />
              <span>Actions</span>
            </button>
          </>
        )}
      </div>

      {/* Action Sheet for More Options (using supported API) */}
      <ActionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        anchorRef={actionsBtnRef}
        align="right"
        placement="bottom"
        items={[
          {
            label: "Forward",
            icon: MdForward,
            disabled: selectedCount === 0,
            onClick: handleForward,
          },
          {
            label: "Copy",
            icon: MdContentCopy,
            disabled: selectedCount === 0,
            onClick: onCopy,
          },
          {
            label: "Delete",
            icon: MdDeleteOutline,
            disabled: selectedCount === 0,
            danger: true,
            onClick: handleDelete,
          },
          {
            label: "Close",
            icon: MdClose,
            onClick: () => setSheetOpen(false),
          },
        ]}
      />
    </div>
  );
}

export default SelectMessagesBar;