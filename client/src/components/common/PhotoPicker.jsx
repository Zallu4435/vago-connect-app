import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

function PhotoPicker({ onChange, accept = "image/*" }) {
  const [mounted, setMounted] = useState(false);
  const [target, setTarget] = useState(null);

  useEffect(() => {
    setMounted(true);
    // Ensure the target element for the portal exists
    let el = document.getElementById("photo-picker-element");
    if (!el) {
      el = document.createElement("div");
      el.id = "photo-picker-element";
      document.body.appendChild(el);
    }
    setTarget(el);

    // Clean up the element if component unmounts
    return () => {
      if (el && document.body.contains(el)) {
        document.body.removeChild(el);
      }
    };
  }, []);

  if (!mounted || !target) return null;

  return ReactDOM.createPortal(
    <input type="file" hidden id="photo-picker" accept={accept} onChange={onChange} />,
    target
  );
}

export default PhotoPicker;