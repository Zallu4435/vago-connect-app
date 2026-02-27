import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import type { User } from "../types";
import { getTokenExpiry, isTokenExpired, scheduleTokenRefresh, clearScheduledRefresh } from "@/lib/tokenManager";

type TimeoutLike = ReturnType<typeof setTimeout> | null;

interface AuthState {
  userInfo: User | null;
  accessToken: string | null;
  tokenExpiresAt: number | null;
  refreshTimeoutId: TimeoutLike;
  setUserInfo: (user: User | null) => void;
  clearUserInfo: () => void;
  setAccessToken: (token: string | null) => void;
  getAccessToken: () => string | null;
  clearAuth: () => void;
  scheduleRefresh: (refreshFn?: () => void) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        userInfo: null,
        accessToken: null,
        tokenExpiresAt: null,
        refreshTimeoutId: null,

        setUserInfo: (user) => set({ userInfo: user }),
        clearUserInfo: () => set({ userInfo: null }),

        setAccessToken: (token) => {
          // allow clearing via null
          if (!token) {
            // clear existing timeout and token state
            const currentId = get().refreshTimeoutId;
            if (currentId) clearScheduledRefresh(currentId as unknown as number);
            set({ accessToken: null, tokenExpiresAt: null, refreshTimeoutId: null });
            return;
          }
          // compute expiry
          const expMs = getTokenExpiry(token);
          set({ accessToken: token, tokenExpiresAt: expMs ?? null });
        },

        getAccessToken: () => {
          const token = get().accessToken;
          if (!token) return null;
          if (isTokenExpired(token)) return null;
          return token;
        },

        clearAuth: () => {
          const currentId = get().refreshTimeoutId;
          if (currentId) clearScheduledRefresh(currentId as unknown as number);
          set({ accessToken: null, tokenExpiresAt: null, refreshTimeoutId: null, userInfo: null });
        },

        scheduleRefresh: (refreshFn) => {
          const state = get();
          // clear existing
          if (state.refreshTimeoutId) clearScheduledRefresh(state.refreshTimeoutId as unknown as number);
          const token = state.accessToken;
          if (!token) {
            set({ refreshTimeoutId: null });
            return;
          }
          const id = scheduleTokenRefresh(token, () => {
            try { refreshFn?.(); } catch { }
          }, 5);
          set({ refreshTimeoutId: (id as unknown as TimeoutLike) || null });
        },

        isAuthenticated: () => {
          const token = get().accessToken;
          if (!token) return false;
          return !isTokenExpired(token);
        },
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

