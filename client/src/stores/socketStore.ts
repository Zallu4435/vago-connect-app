import { MutableRefObject } from "react";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

type SocketRef = MutableRefObject<any | null>;

interface SocketState {
  socket: SocketRef;
  setSocket: (socketRef: SocketRef) => void;
  clearSocket: () => void;
}

const initialSocketRef: SocketRef = { current: null } as unknown as SocketRef;

export const useSocketStore = create<SocketState>()(
  devtools(
    (set) => ({
      socket: initialSocketRef,
      setSocket: (socketRef) =>
        set(() => ({ socket: socketRef })),
      clearSocket: () => set(() => ({ socket: { current: null } as SocketRef })),
    }),
    { name: "socket-store" }
  )
);

