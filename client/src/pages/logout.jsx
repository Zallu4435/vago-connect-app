import { firebaseAuth } from "@/utils/FirebaseConfig";
import { signOut } from "firebase/auth";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useSocketStore } from "@/stores/socketStore";
import { showToast } from "@/lib/toast";

function logout() {
  const userInfo = useAuthStore((s) => s.userInfo);
  const clearUserInfo = useAuthStore((s) => s.clearUserInfo);
  const socket = useSocketStore((s) => s.socket);
  const router = useRouter();
  
  useEffect(() => {
    showToast.info("Logging out...");
    if (userInfo?.id) socket?.current?.emit?.("signout", userInfo.id);
    clearUserInfo();
    signOut(firebaseAuth);
    router.push("/login");
  }, [socket, userInfo?.id, clearUserInfo, router]);
  
  return <div className="bg-conversation-panel-background"></div>;
}

export default logout;
