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

function logout() {
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
          try { socket.current.emit("signout", userInfo.id); } catch {}
          try { socket.current.disconnect(); } catch {}
        }

        // Backend logout to clear refresh cookie
        try { await api.post("/api/auth/logout", undefined, { withCredentials: true }); } catch {}

        // Clear client stores and caches
        clearAuth();
        try { clearChat?.(); } catch {}
        try { resetCallState?.(); } catch {}
        try { queryClient.clear(); } catch {}

        // Firebase sign out
        try { await signOut(firebaseAuth); } catch {}

        // Feedback
        showToast.info("Logged out");

        // Redirect
        router.push("/login");
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Logout error:", error);
        router.push("/login");
      }
    };
    performLogout();
  }, [socket, userInfo?.id, router]);
  
  return (
    <ProtectedRoute>
      <div className="bg-conversation-panel-background h-screen w-screen flex items-center justify-center text-white">
        <div>Logging out...</div>
      </div>
    </ProtectedRoute>
  );
}

export default logout;
