import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { firebaseAuth } from "@/utils/FirebaseConfig";
import React from "react";
import { useLoginUser } from "@/hooks/auth/useAuthStatus";
import { FcGoogle } from "react-icons/fc";
import { FaMagic, FaScroll } from "react-icons/fa";
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

  const [isLoading, setIsLoading] = React.useState(false);
  const loginMutation = useLoginUser();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setIsLoading(true);
      const result = await signInWithPopup(firebaseAuth, provider);
      const firebaseToken = await result.user.getIdToken();
      const email = result.user.email;

      const data = await loginMutation.mutateAsync({ email, firebaseToken });

      const { accessToken: at, user } = data || {};
      if (!at || !user) throw new Error("Invalid login response from the server.");

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
      showToast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="
      flex justify-center items-center 
      bg-ancient-bg-dark 
      min-h-screen h-screen w-screen 
      flex-col gap-6 sm:gap-10 
      px-4 sm:px-6 
      overflow-y-auto
      pb-safe
    ">
      {/* Themed Logo and Title */}
      <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 text-ancient-text-light animate-fade-in-up">
        <FaScroll className="text-6xl sm:text-8xl md:text-9xl text-ancient-icon-glow drop-shadow-lg animate-pulse-light" />
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold font-serif select-none text-center tracking-wide drop-shadow-xl px-4">
          Vago Connect
        </h1>
        <p className="text-ancient-text-muted text-sm sm:text-lg text-center max-w-xs sm:max-w-md px-4">
          Sign in to continue.
        </p>
      </div>

      {/* Themed Login Button */}
      <button
        className="
          flex items-center justify-center gap-4 sm:gap-6 md:gap-8 
          bg-ancient-bg-medium p-4 sm:p-6 
          rounded-xl hover:bg-ancient-bubble-user-light 
          transition-all duration-300 
          shadow-2xl border border-ancient-border-stone 
          hover:border-ancient-icon-glow group 
          transform hover:scale-105 
          active:scale-95
          max-w-[90vw] sm:max-w-xl
          w-full sm:w-auto
          disabled:opacity-50 disabled:cursor-not-allowed
        "
        onClick={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="w-7 h-7 sm:w-8 sm:h-8 border-[3px] border-ancient-icon-glow border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="text-ancient-text-light text-lg sm:text-2xl md:text-3xl font-bold select-none tracking-wider">
              Authenticating…
            </span>
          </>
        ) : (
          <>
            <FcGoogle className="text-3xl sm:text-4xl md:text-5xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6 drop-shadow-md flex-shrink-0" />
            <span className="text-ancient-text-light text-lg sm:text-2xl md:text-3xl font-bold select-none tracking-wider group-hover:text-ancient-icon-glow">
              Sign in with Google
            </span>
            <FaMagic className="hidden sm:block text-3xl sm:text-4xl md:text-5xl text-ancient-icon-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:animate-spin-slow flex-shrink-0" />
          </>
        )}
      </button>

      {/* Footer */}
      <p className="text-ancient-text-muted text-xs sm:text-sm text-center animate-fade-in delay-500 px-4 max-w-md">
        By continuing, you agree to our terms and privacy policy.
      </p>
    </div>
  );
}

export default Login;
