import React from "react";
import { BsCheck, BsCheck2, BsCheck2All } from "react-icons/bs";

function MessageStatus({ MessageStatus }) {
  return (
    <>
      {MessageStatus === 'sent' && <BsCheck className="text-xs" />}
      {MessageStatus === 'delivered' && <BsCheck2 className="text-xs" />}
      {MessageStatus === 'read' && <BsCheck2All className="text-xs" />}
    </>
  )
}

export default MessageStatus;
