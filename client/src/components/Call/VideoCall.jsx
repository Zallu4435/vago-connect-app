import React from "react";
import dynamic from "next/dynamic";
import { useStateProvider } from "@/context/StateContext";

const Container = dynamic(() => import("./Container"), { ssr: false });

function VideoCall() {
  const [{ videoCall, call }] = useStateProvider();
  if (!videoCall || !call) return null;
  return <Container data={call} />;
}

export default VideoCall;
