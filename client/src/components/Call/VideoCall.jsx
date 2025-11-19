import React from "react";
import dynamic from "next/dynamic";
import { useCallStore } from "@/stores/callStore";

const Container = dynamic(() => import("./Container"), { ssr: false });

function VideoCall() {
  const videoCall = useCallStore((s) => s.videoCall);
  const call = useCallStore((s) => s.call);
  if (!videoCall || !call) return null;
  return <Container data={call} />;
}

export default VideoCall;
