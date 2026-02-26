import React, { useRef } from "react";
import { useClickOutside } from '@/hooks/ui/useClickOutside';
import ReactDOM from "react-dom";
import { FaMagic } from "react-icons/fa";

function ContextMenu({ options, cordinates, contextMenu, setContextMenu }) {
  const contextMenuRef = useRef(null);

  // Dismiss on click outside or Escape key (for accessibility and mobile)
  useClickOutside(contextMenu, () => setContextMenu(false), [contextMenuRef]);

  // Clamp coordinates to viewport edge (prevents off-screen context menus on mobile)
  const clamp = (pos, min, max) => Math.max(min, Math.min(pos, max));
  const menuWidth = 240;
  const menuHeight = Math.min(48 * options.length, 320);
  const margin = 8;
  const x = clamp(cordinates.x, margin, window.innerWidth - menuWidth - margin);
  const y = clamp(cordinates.y, margin, window.innerHeight - menuHeight - margin);

  const handleClick = (e, callback) => {
    e.stopPropagation();
    callback();
    setContextMenu(false);
  };

  return ReactDOM.createPortal(
    (
      <div
        className="fixed z-[9999]"
        style={{
          top: y,
          left: x,
          minWidth: menuWidth,
          maxWidth: '95vw',
          maxHeight: menuHeight,
        }}
      >
        <div
          className="bg-ancient-bg-medium py-2 shadow-2xl rounded-lg border border-ancient-border-stone animate-zoom-in-fade-in"
          ref={contextMenuRef}
          tabIndex={0}
          role="menu"
        >
          <ul className="text-ancient-text-light text-base font-medium">
            {options.map(({ name, callback }) => (
              <li
                key={name}
                onClick={(e) => handleClick(e, callback)}
                className="
                  px-4 py-2 flex items-center gap-2
                  hover:bg-ancient-bubble-user-light
                  cursor-pointer transition-colors duration-200
                  text-sm md:text-base
                "
                tabIndex={0}
                role="menuitem"
                aria-label={name}
              >
                <FaMagic className="text-ancient-icon-glow text-lg opacity-70" />
                <span>{name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
    document.body
  );
}

export default ContextMenu;
