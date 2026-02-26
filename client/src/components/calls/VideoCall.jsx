import React from "react";
import dynamic from "next/dynamic";
import { useCallStore } from "@/stores/callStore";

// The Container component will now have the full-screen styling
const Container = dynamic(() => import("./Container"), { ssr: false });

function VideoCall() {
  const videoCall = useCallStore((s) => s.videoCall);
  const call = useCallStore((s) => s.call);
  if (!videoCall || !call) return null;

  // The Container itself will handle the full-screen overlay
  return <Container data={call} />;
}

export default VideoCall;