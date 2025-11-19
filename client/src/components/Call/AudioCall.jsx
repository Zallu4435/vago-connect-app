import dynamic from "next/dynamic";
import React from "react";
import { useCallStore } from "@/stores/callStore";

const Container = dynamic(() => import("./Container"), { ssr: false });

function AudioCall() {
  const audioCall = useCallStore((s) => s.audioCall);
  const call = useCallStore((s) => s.call);
  if (!audioCall || !call) return null;
  return <Container data={call} />;
}

export default AudioCall;
