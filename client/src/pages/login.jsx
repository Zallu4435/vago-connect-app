import { firebaseAuth } from "@/utils/FirebaseConfig";
import { api } from "@/lib/api";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import Image from "next/image";
import React from "react";
import { FcGoogle } from "react-icons/fc";
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
    const result = await signInWithPopup(firebaseAuth, provider);
    try {
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
      console.log(err);
      const msg = "Login failed. Please try again";
      showToast.error(msg);
    }
  };
  
  return (
    <div className="flex justify-center items-center bg-panel-header-background h-screen w-screen flex-col gap-6">
      <div className="flex items-center justify-center gap-2 text-white">
        <Image src="/whatsapp.gif" alt="Whatsapp" height={300} width={300} />
        <span className="text-7xl">Whatsapp</span>
      </div>
      <button
        className="flex items-center justify-center gap-7 bg-search-input-container-background p-5 rounded-lg"
        onClick={handleLogin}
      >
        <FcGoogle className="text-4xl" />
        <span className="text-white text-2xl">Login with Google</span>
      </button>
    </div>
  );
}

export default Login;
