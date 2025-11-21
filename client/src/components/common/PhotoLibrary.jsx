import React from "react";
import { IoClose } from "react-icons/io5";
import Image from "next/image";
import { FaFolderOpen } from "react-icons/fa";

function PhotoLibrary({ onSelect, onClose }) {
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
    <div className="
      fixed inset-0 z-[200] flex items-center justify-center
      p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in
    ">
      <div className="
        relative bg-ancient-bg-dark rounded-xl
        p-4 sm:p-6 w-full max-w-[370px] sm:max-w-[480px]
        shadow-2xl border border-ancient-border-stone animate-zoom-in
      ">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 text-ancient-text-muted hover:text-red-400 transition-colors duration-200"
        >
          <IoClose className="h-6 w-6 sm:h-7 sm:w-7" />
        </button>

        <h3 className="text-ancient-text-light text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <FaFolderOpen className="text-ancient-icon-glow text-2xl sm:text-3xl" />
          Choose an avatar
        </h3>

        <div className="
          grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4
          max-h-[55vh] sm:max-h-[70vh] md:max-h-[80vh]
          overflow-y-auto custom-scrollbar pr-1
        ">
          {images.map((src) => (
            <button
              key={src}
              onClick={() => onSelect(src)}
              className="
                relative h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-full
                border-2 border-ancient-border-stone hover:border-ancient-icon-glow
                focus:outline-none focus:ring-2 focus:ring-ancient-icon-glow
                transition-all duration-200 transform hover:scale-105
                bg-ancient-input-bg
              "
              title="Select"
            >
              <Image src={src} alt="avatar option" className="object-cover" fill />
              <div
                className="
                  absolute inset-0 bg-ancient-icon-glow/20
                  opacity-0 hover:opacity-100 transition-opacity duration-200
                "
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PhotoLibrary;
