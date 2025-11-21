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
    <div className="sticky bottom-4 self-center mt-4 z-10">
      <div className="flex items-center gap-3 bg-ancient-bg-medium border border-ancient-border-stone rounded-full px-4 py-2 shadow-lg">
        <button
          className="text-base text-ancient-text-light/90 hover:text-ancient-icon-glow transition-colors duration-200"
          onClick={() => (selectMode ? onCancel?.() : onToggleSelect?.())}
        >
          {selectMode ? "Cancel Selection" : "Select Messages"}
        </button>
        {selectMode && (
          <>
            <span className="text-ancient-text-muted text-sm">
              {selectedCount} selected
            </span>
            <button
              className="bg-ancient-icon-glow hover:bg-ancient-bubble-user text-ancient-bg-dark text-sm px-4 py-2 rounded-full disabled:opacity-50 transition-colors duration-200 font-semibold shadow-md"
              disabled={selectedCount === 0}
              onClick={() => setSheetOpen(true)}
            >
              Actions
            </button>
          </>
        )}
      </div>

      <ActionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Selected messages">
        <div className="flex flex-col gap-2 p-2">
          <button
            className="w-full text-left px-3 py-2 rounded-md hover:bg-ancient-input-bg border border-ancient-input-border text-ancient-text-light disabled:opacity-50"
            disabled={selectedCount === 0}
            onClick={() => {
              setSheetOpen(false);
              onForward?.();
            }}
          >
            Forward
          </button>
          <button
            className="w-full text-left px-3 py-2 rounded-md hover:bg-ancient-input-bg border border-ancient-input-border text-ancient-text-light"
            onClick={() => {
              setSheetOpen(false);
              onCancel?.();
            }}
          >
            Cancel Selection
          </button>
        </div>
      </ActionSheet>
    </div>
  );
}

export default SelectMessagesBar;
