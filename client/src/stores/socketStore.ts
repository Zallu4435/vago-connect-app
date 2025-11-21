import { MutableRefObject } from "react";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

type SocketRef = MutableRefObject<any | null>;

interface SocketState {
  socket: SocketRef;
  shouldConnect: boolean;
  setSocket: (socketRef: SocketRef) => void;
  clearSocket: () => void;
  setShouldConnect: (value: boolean) => void;
}

const initialSocketRef: SocketRef = { current: null } as unknown as SocketRef;

export const useSocketStore = create<SocketState>()(
  devtools(
    (set) => ({
      socket: initialSocketRef,
      shouldConnect: false,
      setSocket: (socketRef) =>
        set(() => ({ socket: socketRef })),
      clearSocket: () => set(() => ({ socket: { current: null } as SocketRef })),
      setShouldConnect: (value) => set(() => ({ shouldConnect: value })),
    }),
    { name: "socket-store" }
  )
);

