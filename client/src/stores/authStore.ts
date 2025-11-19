import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import type { User } from "../types";

interface AuthState {
  userInfo: User | null;
  setUserInfo: (user: User | null) => void;
  clearUserInfo: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        userInfo: null,
        setUserInfo: (user) => set({ userInfo: user }),
        clearUserInfo: () => set({ userInfo: null }),
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({ userInfo: state.userInfo }),
        storage: createJSONStorage(() =>
          typeof window !== "undefined" ? localStorage : undefined as unknown as Storage
        ),
      }
    ),
    { name: "auth-store" }
  )
);

