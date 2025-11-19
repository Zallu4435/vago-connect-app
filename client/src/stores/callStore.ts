import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Call } from "../types";

interface CallState {
  audioCall: boolean;
  videoCall: boolean;
  call: Call | undefined;
  calling: boolean;
  callAccepted: boolean;
  callRejected: boolean;

  setAudioCall: (value: boolean) => void;
  setVideoCall: (value: boolean) => void;
  setCall: (call: Call | undefined) => void;
  initiateCall: (call: Call, type: "audio" | "video") => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  resetCallState: () => void;
}

export const useCallStore = create<CallState>()(
  devtools(
    (set) => ({
      audioCall: false,
      videoCall: false,
      call: undefined,
      calling: false,
      callAccepted: false,
      callRejected: false,

      setAudioCall: (value) => set({ audioCall: value }),
      setVideoCall: (value) => set({ videoCall: value }),
      setCall: (call) => set({ call }),

      initiateCall: (call, type) =>
        set({
          call,
          audioCall: type === "audio",
          videoCall: type === "video",
          calling: true,
          callAccepted: false,
          callRejected: false,
        }),

      acceptCall: () => set({ callAccepted: true, calling: false }),
      rejectCall: () => set({ callRejected: true, calling: false }),

      endCall: () =>
        set({
          audioCall: false,
          videoCall: false,
          call: undefined,
          calling: false,
          callAccepted: false,
          callRejected: false,
        }),

      resetCallState: () =>
        set({
          audioCall: false,
          videoCall: false,
          call: undefined,
          calling: false,
          callAccepted: false,
          callRejected: false,
        }),
    }),
    { name: "call-store" }
  )
);

