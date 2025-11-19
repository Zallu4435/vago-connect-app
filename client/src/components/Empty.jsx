import React from "react";
import Image from "next/image";

function Empty() {
  return (
    <div className="border-conversation-border border-1 w-full bg-panel-header-background flex flex-col h-[100vh] items-center justify-center border-b-4 border-b-icon-green">
      <Image 
        src="/whatsapp.gif" 
        alt="whatsapp" 
        width={300} 
        height={300} 
      />
    </div>
  );
}

export default Empty;
