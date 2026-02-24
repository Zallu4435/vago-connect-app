import React from "react";
import { BsCheck, BsCheck2, BsCheck2All } from "react-icons/bs";
import { MdAccessTime, MdErrorOutline } from "react-icons/md";

function MessageStatus({ status, MessageStatus, className = "" }) {
  const s = (status || MessageStatus || "").toLowerCase();
  const base = `align-bottom text-[13px] sm:text-[15px] ${className}`; // Scales with screen size

  if (s === "read")
    return (
      <BsCheck2All
        className={`${base} text-ancient-icon-glow`}
        aria-label="Read"
        role="img"
        focusable="false"
      />
    );
  if (s === "delivered")
    return (
      <BsCheck2
        className={`${base} text-ancient-text-muted`}
        aria-label="Delivered"
        role="img"
        focusable="false"
      />
    );
  if (s === "sent")
    return (
      <BsCheck
        className={`${base} text-ancient-text-muted`}
        aria-label="Sent"
        role="img"
        focusable="false"
      />
    );
  if (s === "pending")
    return (
      <MdAccessTime
        className={`${base} text-ancient-text-muted opacity-70`}
        aria-label="Pending"
        role="img"
        focusable="false"
      />
    );
  if (s === "error")
    return (
      <MdErrorOutline
        className={`${base} text-red-500`}
        aria-label="Error"
        role="img"
        focusable="false"
      />
    );
  return null;
}

export default MessageStatus;
