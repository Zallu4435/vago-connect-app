import dynamic from "next/dynamic";
import React from "react";
import { useStateProvider } from "@/context/StateContext";

const Container = dynamic(() => import("./Container"), { ssr: false });

function VoiceCall() {  
  const [{ audioCall, call }] = useStateProvider();
  if (!audioCall || !call) return null;
  return <Container data={call} />;
}

export default VoiceCall;
