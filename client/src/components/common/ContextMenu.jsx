import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { FaMagic } from "react-icons/fa"; // Reliable subtle animation icon

function ContextMenu({ options, cordinates, contextMenu, setContextMenu }) {
  const contextMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenuRef, setContextMenu]); // Added setContextMenu to dependency array

  const handleClick = (e, callback) => {
    e.stopPropagation();
    callback();
    setContextMenu(false);
  };
  
  return ReactDOM.createPortal(
    (
      <div
        className={"bg-ancient-bg-medium fixed py-3 z-[9999] shadow-2xl rounded-lg min-w-[220px] border border-ancient-border-stone animate-zoom-in-fade-in transform -translate-x-1/2"}
        ref={contextMenuRef}
        style={{ top: cordinates.y, left: cordinates.x }}
      >
        <ul className="text-ancient-text-light text-base font-medium">
          {options.map(({ name, callback }) => (
            <li
              key={name}
              onClick={(e) => handleClick(e, callback)}
              className="px-5 py-2 flex items-center gap-3 hover:bg-ancient-bubble-user-light cursor-pointer transition-colors duration-200"
            >
              <FaMagic className="text-ancient-icon-glow text-lg opacity-70" />
              <span>{name}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
    document.body
  );
}

export default ContextMenu;