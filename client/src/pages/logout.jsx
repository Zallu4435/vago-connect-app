import { firebaseAuth } from "@/utils/FirebaseConfig";
import { signOut } from "firebase/auth";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useCallStore } from "@/stores/callStore";
import { useSocketStore } from "@/stores/socketStore";
import { queryClient } from "@/lib/queryClient";
import { api } from "@/lib/api";
import { showToast } from "@/lib/toast";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { FaMagic } from "react-icons/fa";

function LogoutPage() { // Renamed component to follow Next.js page conventions
  const userInfo = useAuthStore((s) => s.userInfo);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const clearChat = useChatStore((s) => s.clearChat);
  const resetCallState = useCallStore((s) => s.resetCallState);
  const socket = useSocketStore((s) => s.socket);
  const router = useRouter();
  
  useEffect(() => {
    const performLogout = async () => {
      try {
        // Emit socket signout if connected and then disconnect
        if (socket?.current && userInfo?.id) {
          try {
            console.log("Signing out socket...");
            socket.current.emit("signout", userInfo.id);
          } catch (e) {
            console.warn("Socket signout emission failed:", e);
          }
          try {
            socket.current.disconnect();
            console.log("Socket disconnected.");
          } catch (e) {
            console.warn("Socket disconnection failed:", e);
          }
        }

        // Backend logout to clear refresh cookie
        try {
          await api.post("/api/auth/logout", undefined, { withCredentials: true });
          console.log("Server session cleared.");
        } catch (e) {
          console.warn("Backend logout failed:", e);
        }

        // Clear client stores and caches
        clearAuth();
        try { clearChat?.(); } catch (e) { console.warn("Clearing chat history failed:", e); }
        try { resetCallState?.(); } catch (e) { console.warn("Resetting call state failed:", e); }
        try { queryClient.clear(); } catch (e) { console.warn("Clearing query cache failed:", e); }
        console.log("Local session cleared.");

        // Firebase sign out
        try {
          await signOut(firebaseAuth);
          console.log("Firebase sign out complete.");
        } catch (e) {
          console.warn("Firebase sign out failed:", e);
        }

        // Feedback
        showToast.info("Signed out successfully.");

        // Redirect
        router.push("/login");
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Logout error:", error);
        showToast.error("Could not sign out cleanly. Redirecting to login.");
        router.push("/login"); // Ensure redirect even on error
      }
    };
    performLogout();
  }, [socket, userInfo?.id, router, clearAuth, clearChat, resetCallState]); 

  return (
    <ProtectedRoute>
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-ancient-bg-dark text-ancient-text-light animate-fade-in">
        <div className="relative mb-4">
          <FaMagic className="text-6xl text-ancient-icon-glow drop-shadow-lg animate-pulse-light-slow" />
        </div>
        <div className="mb-3 text-2xl font-bold font-serif drop-shadow-lg text-center tracking-wide">Signing out</div>
        <LoadingSpinner label="Signing you out..." />
        <div className="mt-3 text-ancient-text-muted text-sm animate-fade-in delay-700">Please wait...</div>
      </div>
    </ProtectedRoute>
  );
}

export default LogoutPage;