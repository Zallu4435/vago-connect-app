import dynamic from "next/dynamic";
import React from "react";
import { useCallStore } from "@/stores/callStore";

// The Container component is designed to handle the thematic display
// for both audio and video calls based on the 'data.callType' prop.
const Container = dynamic(() => import("./Container"), { ssr: false });

function AudioCall() {
  const audioCall = useCallStore((s) => s.audioCall);
  const call = useCallStore((s) => s.call);

  // If there's no active audio call or call data, render nothing.
  if (!audioCall || !call) return null;

  // Render the themed Container component, passing the call data.
  // The Container will adapt its display based on data.callType.
  return <Container data={call} />;
}

export default AudioCall;