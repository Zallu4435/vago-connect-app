import React from "react";
import { BsCheck, BsCheck2, BsCheck2All } from "react-icons/bs";

function MessageStatus({ status, MessageStatus, className = "" }) {
  const s = (status || MessageStatus || "").toLowerCase();
  const base = `text-[12px] align-bottom ${className}`;
  if (s === "read") return <BsCheck2All className={`${base} text-ancient-icon-glow`} aria-label="Read" />;
  if (s === "delivered") return <BsCheck2 className={`${base} text-ancient-text-muted`} aria-label="Delivered" />;
  if (s === "sent") return <BsCheck className={`${base} text-ancient-text-muted`} aria-label="Sent" />;
  return null;
}

export default MessageStatus;
