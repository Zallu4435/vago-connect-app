import { firebaseAuth } from "@/utils/FirebaseConfig";
import { api } from "@/lib/api";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import React from "react";
import { FcGoogle } from "react-icons/fc";
import { HiChatBubbleLeftRight } from "react-icons/hi2";
import { useRouter } from "next/router";
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/lib/toast";
import { isTokenExpired } from "@/lib/tokenManager";

function Login() {
  const router = useRouter();
  const setUserInfo = useAuthStore((s) => s.setUserInfo);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const accessToken = useAuthStore((s) => s.accessToken);

  React.useEffect(() => {
    if (accessToken && !isTokenExpired(accessToken)) {
      router.push("/");
    }
  }, [accessToken, router]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(firebaseAuth, provider);
      const firebaseToken = await result.user.getIdToken();
      const email = result.user.email;
      const { data } = await api.post(
        "/api/auth/login",
        { firebaseToken, email },
        { withCredentials: true }
      );
      const { accessToken: at, user } = data || {};
      if (!at || !user) throw new Error("Invalid login response");
      setAccessToken(at);
      setUserInfo({
        id: String(user.id),
        name: user.name,
        email: user.email,
        profileImage: user.image || user.profileImage || "",
        about: user.about || "",
      });
      router.push("/");
    } catch (err) {
      console.error(err);
      showToast.error("Login failed. Please try again");
    }
  };

  return (
    <div className="flex justify-center items-center bg-[#0B141A] h-screen w-screen flex-col gap-6">
      <div className="flex items-center justify-center gap-4 text-[#E9EDEF]">
        <HiChatBubbleLeftRight className="text-9xl text-[#00A884]" />
        <span className="text-7xl font-semibold select-none">GhostChat</span>
      </div>
      <button
        className="flex items-center justify-center gap-6 bg-[#1F2C34] p-5 rounded-lg hover:bg-[#2A3942] transition-all duration-300 shadow-lg border border-[#2A3942] hover:border-[#374954] group"
        onClick={handleLogin}
      >
        <FcGoogle className="text-4xl transition-transform duration-300 group-hover:scale-110" />
        <span className="text-[#E9EDEF] text-2xl font-medium select-none">Login with Google</span>
      </button>
    </div>
  );
}

export default Login;