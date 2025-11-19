import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

function PhotoPicker({ onChange, accept = "image/*" }) {
  const [mounted, setMounted] = useState(false);
  const [target, setTarget] = useState(null);

  useEffect(() => {
    setMounted(true);
    const el = document.getElementById("photo-picker-element");
    if (el) setTarget(el);
  }, []);

  if (!mounted || !target) return null;

  return ReactDOM.createPortal(
    <input type="file" hidden id="photo-picker" accept={accept} onChange={onChange} />,
    target
  );
}

export default PhotoPicker;
