"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "../common/MessageStatus"; // Assuming this is themed already
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { FaImage } from "react-icons/fa"; // Reliable icon for loading placeholder

function ImageMessage({ message }) {
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const userInfo = useAuthStore((s) => s.userInfo);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false); // For full-screen image viewer

  const isIncoming = message?.senderId === currentChatUser?.id;
  const senderName = message?.sender?.name || "Unknown"; // Assuming message has sender details
  const senderAvatar = message?.sender?.profileImage || "/default_mystical_avatar.png";
  const hasCaption = message.caption && message.caption.trim().length > 0; // Assuming message.caption exists

  // Reset imageLoaded state when message content changes
  useEffect(() => {
    setImageLoaded(false);
  }, [message.content]);


  return (
    <>
      <div
        className={`relative max-w-xs sm:max-w-sm md:max-w-md lg:max-w-[400px] rounded-xl overflow-hidden shadow-xl
          ${isIncoming ? "bg-ancient-bubble-incoming border border-ancient-input-border" : "bg-ancient-bubble-user border border-ancient-icon-glow"}`}
        // Optional: Add onClick to open a full-screen image viewer
        onClick={() => setShowImageViewer(true)}
      >
        {/* Sender Avatar for Incoming Messages */}
        {isIncoming && message?.sender && (
            <div className="absolute top-2 left-2 z-10 relative h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-ancient-input-bg border border-ancient-border-stone">
            <Image src={senderAvatar} alt={senderName} fill className="object-cover" />
            </div>
        )}

        {/* Loading Placeholder */}
        {!imageLoaded && (
          <div
            className={`flex items-center justify-center w-[300px] h-[300px] sm:w-[300px] sm:h-[300px] md:w-[400px] md:h-[400px] rounded-xl
              ${isIncoming ? "bg-ancient-input-bg" : "bg-ancient-input-border"} animate-pulse`}
          >
            <FaImage className={`text-5xl ${isIncoming ? "text-ancient-text-muted" : "text-ancient-icon-glow"}`} />
          </div>
        )}

        {/* The Image */}
        <Image
          src={message.content}
          alt={hasCaption ? message.caption : "Sent image"}
          height={300} // These values control the initial space. Adjust as needed.
          width={300} // For responsive images, consider using object-fit and max-width/height.
          className={`rounded-xl object-cover w-full h-full ${imageLoaded ? 'block' : 'hidden'}`}
          onLoad={() => setImageLoaded(true)}
          priority={false} // Adjust priority based on your app's needs
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw" // Example for responsive images
        />

        {/* Caption (if exists) */}
        {hasCaption && (
          <div className={`p-3 text-sm ${isIncoming ? "text-ancient-text-light" : "text-ancient-bg-dark"}`}>
            {message.caption}
          </div>
        )}

        {/* Metadata Overlay */}
        <div
          className={`absolute bottom-0 right-0 p-2 flex items-end gap-1
            ${hasCaption ? "bg-gradient-to-t from-black/60 to-transparent w-full" : "bg-black/40 rounded-tl-xl"} `}
        >
          <span className={`text-[11px] pt-1 min-w-fit
            ${isIncoming ? "text-ancient-text-muted" : "text-ancient-bg-dark/80"}`}
          >
            {calculateTime(message.timestamp)}
          </span>
          <span>
            {message.senderId === userInfo.id && <MessageStatus MessageStatus={message.messageStatus} />}
          </span>
        </div>

        {/* Sender Avatar for Outgoing Messages (moved to bottom right corner) */}
        {!isIncoming && message?.sender && (
            <div className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-ancient-input-bg border border-ancient-icon-glow">
            <Image src={senderAvatar} alt={senderName} fill className="object-cover" />
            </div>
        )}

      </div>

      {/* Full-screen Image Viewer Modal (Placeholder) */}
      {showImageViewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowImageViewer(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl z-50 hover:text-red-400 transition-colors"
            onClick={() => setShowImageViewer(false)}
          >
            &times;
          </button>
          <Image
            src={message.content}
            alt={hasCaption ? message.caption : "Full size image"}
            fill
            className="object-contain" // Ensures image fits within the screen
          />
          {hasCaption && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/60 text-white text-center text-sm">
              {message.caption}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default ImageMessage;