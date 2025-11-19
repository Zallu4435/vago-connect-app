import React, { useEffect, useRef } from "react";

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
  }, [contextMenuRef]);

  const handleClick = (e, callback) => {
    e.stopPropagation();
    callback();
    setContextMenu(false);
  };
  
  return (
    <div
      className={"bg-dropdown-background fixed py-2 z-[100] shadow-xl rounded-md min-w-[200px]"}
      ref={contextMenuRef}
      style={{ top: cordinates.y, left: cordinates.x }}
    >
      <ul className="text-white text-sm">
        {options.map(({ name, callback }) => (
          <li
            key={name}
            onClick={(e) => handleClick(e, callback)}
            className="px-4 py-2 hover:bg-white/10 cursor-pointer"
          >
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ContextMenu;
