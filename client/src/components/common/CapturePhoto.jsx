import React, { useEffect, useRef } from "react";

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
              // Ignore AbortError caused by rapid mount/unmount or reloads
              if (err?.name !== "AbortError") console.error("video.play error:", err);
            });
          };
          if (video.readyState >= 1) playSafe();
          else video.onloadedmetadata = playSafe;
        }
      } catch (err) {
        console.error("Camera error:", err);
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-gray-900 rounded-lg p-4 w-[520px] max-w-[95vw] shadow-xl flex flex-col items-center gap-4">
        <video ref={videoRef} className="w-full rounded-md bg-black" playsInline muted autoPlay />
        <div className="flex gap-3">
          <button onClick={handleCapture} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500">Capture</button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600">Cancel</button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

export default CapturePhoto;
