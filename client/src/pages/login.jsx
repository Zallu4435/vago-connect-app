import { firebaseAuth } from "@/utils/FirebaseConfig";
import { api } from "@/lib/api";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import React from "react";
import { FcGoogle } from "react-icons/fc";
import { FaMagic, FaScroll } from "react-icons/fa"; // Reliable icons
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
      if (!at || !user) throw new Error("Invalid login response from the ancient servers.");
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
      showToast.error("The ancient login ritual has failed. Please consult the spirits again."); // Themed error message
    }
  };

  return (
    <div className="flex justify-center items-center bg-ancient-bg-dark h-screen w-screen flex-col gap-10"> {/* Increased gap for more breathing room */}
      {/* Themed Logo and Title */}
      <div className="flex flex-col items-center justify-center gap-6 text-ancient-text-light animate-fade-in-up">
        <FaScroll className="text-9xl text-ancient-icon-glow drop-shadow-lg animate-pulse-light" /> {/* Mystical Scroll Icon */}
        <span className="text-7xl font-bold font-serif select-none text-center tracking-wide drop-shadow-xl">
          Ethereal Whispers
        </span>
        <p className="text-ancient-text-muted text-lg italic text-center max-w-md">
          Unfurl the ancient scrolls and join the sacred communion.
        </p>
      </div>

      {/* Themed Login Button */}
      <button
        className="flex items-center justify-center gap-8 bg-ancient-bg-medium p-6 rounded-xl hover:bg-ancient-bubble-user-light transition-all duration-300 shadow-2xl border border-ancient-border-stone hover:border-ancient-icon-glow group transform hover:scale-105" // Enhanced styling
        onClick={handleLogin}
      >
        <FcGoogle className="text-5xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6 drop-shadow-md" /> {/* Larger Google Icon with more pronounced hover */}
        <span className="text-ancient-text-light text-3xl font-bold select-none tracking-wider group-hover:text-ancient-icon-glow"> {/* Larger, bolder text */}
          Conjure with Google
        </span>
        <FaMagic className="text-5xl text-ancient-icon-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:animate-spin-slow" /> {/* Mystical magic icon on hover */}
      </button>

      {/* Optional: Add a subtle footer */}
      <p className="absolute bottom-8 text-ancient-text-muted text-sm animate-fade-in delay-500">
        By proceeding, you agree to decipher the ancient rites.
      </p>
    </div>
  );
}

export default Login;