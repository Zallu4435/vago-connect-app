import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useCallStore } from "@/stores/callStore";
import { useSocketStore } from "@/stores/socketStore";
import { useLogoutUser } from "@/hooks/auth/useAuthStatus";
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

  const logoutMutation = useLogoutUser();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Emit socket signout if connected and then disconnect
        if (socket?.current && userInfo?.id) {
          try {
            socket.current.emit("signout", userInfo.id);
            socket.current.disconnect();
          } catch (e) {
            // Socket disconnect issue
          }
        }

        // Delegate backend + Firebase logout to mutation hook
        await logoutMutation.mutateAsync();

        // Clear client stores
        clearAuth();
        try { clearChat?.(); } catch (e) { }
        try { resetCallState?.(); } catch (e) { }

        showToast.info("Signed out successfully.");
        router.push("/login");
      } catch (error) {
        showToast.error("Could not sign out cleanly. Redirecting to login.");
        router.push("/login");
      }
    };
    performLogout();
  }, [socket, userInfo?.id, router, clearAuth, clearChat, resetCallState, logoutMutation]);

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