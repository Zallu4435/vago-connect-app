import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

function PhotoPicker({ onChange, accept = "image/*" }) {
  const [mounted, setMounted] = useState(false);
  const [target, setTarget] = useState(null);

  useEffect(() => {
    setMounted(true);
    let el = document.getElementById("photo-picker-element");
    if (!el) {
      el = document.createElement("div");
      el.id = "photo-picker-element";
      document.body.appendChild(el);
    }
    setTarget(el);

    return () => {
      // Only remove if this component created it
      if (el && document.body.contains(el)) {
        // Remove input, but only if it has no children other than our own (defensive)
        el.innerHTML = "";
      }
    };
  }, []);

  if (!mounted || !target) return null;

  return ReactDOM.createPortal(
    <input
      type="file"
      hidden
      id="photo-picker"
      accept={accept}
      onChange={onChange}
      tabIndex={-1}
      aria-label="Select photo"
    />,
    target
  );
}

export default PhotoPicker;
