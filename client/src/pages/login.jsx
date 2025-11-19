import { firebaseAuth } from "@/utils/FirebaseConfig";
import { api } from "@/lib/api";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import Image from "next/image";
import React from "react";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import { CHECK_USER_ROUTE } from "@/utils/ApiRoutes";
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/lib/toast";

function Login() {
  const router = useRouter();
  const setUserInfo = useAuthStore((s) => s.setUserInfo);
  
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    const {
      user: { displayName: name, email, photoURL: profileImage },
    } = await signInWithPopup(firebaseAuth, provider);
    try {
      if (email) {
        const { data } = await api.post(CHECK_USER_ROUTE, { email });
        console.log(data);
        if (!data.status) {
          setUserInfo({ id: "", name: name || "", email, profileImage: profileImage || "", about: "" });
          router.push("/onboarding");
          return;
        }
        if (data.user) {
          setUserInfo({
            id: String(data.user.id),
            name: data.user.name,
            email: data.user.email,
            profileImage: data.user.image,
            about: data.user.about,
          });
          router.push("/");
        }
      }
    } catch (err) {
      console.log(err);
      const msg = err?.response?.status === 440 || err?.message?.toLowerCase?.().includes("session")
        ? "Session expired. Please login again"
        : "Login failed. Please try again";
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
