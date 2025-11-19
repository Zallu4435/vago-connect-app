import React from "react";
import { IoClose } from "react-icons/io5";

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-gray-900 rounded-lg p-4 w-[420px] max-w-[90vw] shadow-xl">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-2 right-2 text-white/80 hover:text-white"
        >
          <IoClose className="h-6 w-6" />
        </button>
        <h3 className="text-white mb-4 font-medium">Choose an avatar</h3>
        <div className="grid grid-cols-3 gap-4">
          {images.map((src) => (
            <button
              key={src}
              onClick={() => onSelect(src)}
              className="relative h-24 w-24 overflow-hidden rounded-full border border-white/10 hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="avatar option" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PhotoLibrary;
