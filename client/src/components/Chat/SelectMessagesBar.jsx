"use client";
import React, { useState } from "react";
import ActionSheet from "@/components/common/ActionSheet";

function SelectMessagesBar({
  selectMode,
  selectedCount = 0,
  onToggleSelect,
  onCancel,
  onForward,
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="sticky bottom-4 self-center mt-4 z-10 w-[95vw] max-w-md mx-auto">
      <div className="flex items-center gap-2 sm:gap-3 bg-ancient-bg-medium border border-ancient-border-stone rounded-full px-3 sm:px-4 py-2 sm:py-2.5 shadow-lg">
        <button
          className="
            text-sm sm:text-base text-ancient-text-light/90
            hover:text-ancient-icon-glow transition-colors duration-200
            whitespace-nowrap
          "
          onClick={() => (selectMode ? onCancel?.() : onToggleSelect?.())}
          type="button"
        >
          {selectMode ? "Cancel Selection" : "Select Messages"}
        </button>
        {selectMode && (
          <>
            <span className="text-ancient-text-muted text-xs sm:text-sm whitespace-nowrap">
              {selectedCount} selected
            </span>
            <button
              className="
                bg-ancient-icon-glow hover:bg-ancient-bubble-user
                text-ancient-bg-dark text-xs sm:text-sm
                px-3 sm:px-4 py-1.5 sm:py-2 rounded-full
                disabled:opacity-50 transition-colors duration-200
                font-semibold shadow-md
                whitespace-nowrap
              "
              disabled={selectedCount === 0}
              onClick={() => setSheetOpen(true)}
              type="button"
            >
              Actions
            </button>
          </>
        )}
      </div>

      <ActionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Selected messages"
        className="max-w-[95vw] sm:max-w-xs"
      >
        <div className="flex flex-col gap-2 p-2">
          <button
            className="
              w-full text-left px-3 py-2 rounded-md hover:bg-ancient-input-bg
              border border-ancient-input-border text-ancient-text-light
              disabled:opacity-50 whitespace-nowrap
            "
            disabled={selectedCount === 0}
            onClick={() => { setSheetOpen(false); onForward?.(); }}
            type="button"
          >
            Forward
          </button>
          <button
            className="
              w-full text-left px-3 py-2 rounded-md hover:bg-ancient-input-bg
              border border-ancient-input-border text-ancient-text-light 
              whitespace-nowrap
            "
            onClick={() => { setSheetOpen(false); onCancel?.(); }}
            type="button"
          >
            Cancel Selection
          </button>
        </div>
      </ActionSheet>
    </div>
  );
}

export default SelectMessagesBar;
