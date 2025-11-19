import React from "react";
import { IoClose } from "react-icons/io5";
import Image from "next/image"; // Ensure Image is imported for Next.js optimization
import { FaFolderOpen } from "react-icons/fa"; // Reliable icon

function PhotoLibrary({ onSelect, onClose }) {
  // Actual files in public/avatars
  const images = [
    "/avatars/1.png",
    "/avatars/2.png",
    "/avatars/3.png",
    "/avatars/4.png",
    "/avatars/5.png",
    "/avatars/6.png",
    "/avatars/7.png",
    "/avatars/8.png",
    "/avatars/9.png",
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-ancient-bg-dark rounded-xl p-6 w-[480px] max-w-[95vw] shadow-2xl border border-ancient-border-stone animate-zoom-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Archive"
          className="absolute top-3 right-3 text-ancient-text-muted hover:text-red-400 transition-colors duration-200"
        >
          <IoClose className="h-7 w-7" />
        </button>

        {/* Title */}
        <h3 className="text-ancient-text-light text-2xl font-bold mb-6 flex items-center gap-3">
          <FaFolderOpen className="text-ancient-icon-glow text-3xl" />
          Consult Ancient Archives
        </h3>

        {/* Image Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
          {images.map((src) => (
            <button
              key={src}
              onClick={() => onSelect(src)}
              className="relative h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-full border-2 border-ancient-border-stone hover:border-ancient-icon-glow focus:outline-none focus:ring-2 focus:ring-ancient-icon-glow transition-all duration-200 transform hover:scale-105"
              title="Select this visage"
            >
              <Image src={src} alt="avatar option" className="object-cover" fill />
              {/* Optional: Add a subtle mystical overlay on hover */}
              <div className="absolute inset-0 bg-ancient-icon-glow/20 opacity-0 hover:opacity-100 transition-opacity duration-200" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PhotoLibrary;