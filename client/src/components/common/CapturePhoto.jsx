import React, { useEffect, useRef } from "react";
import { IoClose } from "react-icons/io5";
import { GiCrystalBall } from "react-icons/gi";
import { FaCamera, FaMagic } from "react-icons/fa";

function CapturePhoto({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const startingRef = useRef(false);

  useEffect(() => {
    const start = async () => {
      if (startingRef.current || streamRef.current) return;
      startingRef.current = true;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          const playSafe = () => {
            video.play().catch((err) => {
              if (err?.name !== "AbortError") console.error("video.play error:", err);
            });
          };
          if (video.readyState >= 1) playSafe();
          else video.onloadedmetadata = playSafe;
        }
      } catch (err) {
        console.error("Camera (Scrying Orb) error:", err);
        onClose?.();
      } finally {
        startingRef.current = false;
      }
    };
    start();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [onClose]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/png");
    onCapture?.(dataUrl);
  };

  return (
    <div className="
      fixed inset-0 z-[200] flex items-center justify-center
      p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in
    ">
      <div className="
        relative bg-ancient-bg-dark rounded-xl
        p-4 sm:p-6 w-full max-w-[420px] sm:max-w-[560px]
        shadow-2xl border border-ancient-border-stone
        flex flex-col items-center gap-4 sm:gap-6 animate-zoom-in
      ">
        <button
          onClick={onClose}
          aria-label="Close Scrying Orb"
          className="absolute top-3 right-3 text-ancient-text-muted hover:text-red-400 transition-colors duration-200"
        >
          <IoClose className="h-6 w-6 sm:h-7 sm:w-7" />
        </button>
        <h3 className="text-ancient-text-light text-xl sm:text-2xl font-bold mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
          <GiCrystalBall className="text-ancient-icon-glow text-2xl sm:text-3xl" />
          Gaze into the Scrying Orb
        </h3>
        <div className="
          relative w-full aspect-video rounded-md overflow-hidden border-2 border-ancient-icon-glow shadow-lg bg-black
          flex items-center justify-center
        ">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
          <FaMagic className="absolute text-[5rem] sm:text-[10rem] text-ancient-icon-glow/30 animate-spin-slow-reverse pointer-events-none" />
        </div>
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2 w-full justify-center">
          <button
            onClick={handleCapture}
            className="
              flex-1 px-5 sm:px-6 py-2.5 sm:py-3 bg-ancient-icon-glow text-ancient-bg-dark font-bold
              rounded-lg hover:bg-ancient-bubble-user-light transition-all duration-300
              shadow-md flex items-center justify-center gap-2
            "
          >
            <FaCamera className="text-lg sm:text-xl" /> Capture Vision
          </button>
          <button
            onClick={onClose}
            className="
              flex-1 px-5 sm:px-6 py-2.5 sm:py-3 bg-ancient-input-bg text-ancient-text-light font-bold
              rounded-lg hover:bg-ancient-input-border transition-all duration-300
              shadow-md flex items-center justify-center gap-2
            "
          >
            Cancel Ritual
          </button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

export default CapturePhoto;
