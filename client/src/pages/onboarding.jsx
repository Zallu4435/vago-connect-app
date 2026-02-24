import React, { useState } from "react";
import ThemedInput from "@/components/common/ThemedInput";
import Avatar from "@/components/common/Avatar";
import { useRouter } from "next/router";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardUser } from "@/hooks/mutations/useOnboardUser";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { GiCrystalBall, GiFeather, GiScrollQuill } from "react-icons/gi";
import { FaMagic } from "react-icons/fa";
import { showToast } from "@/lib/toast";
import LoadingSpinner from "@/components/common/LoadingSpinner";

function Onboarding() {
  const userInfo = useAuthStore((s) => s.userInfo);
  const setUserInfo = useAuthStore((s) => s.setUserInfo);
  const router = useRouter();
  const [name, setName] = useState(userInfo?.name || "");
  const [about, setAbout] = useState("");
  const [image, setImage] = useState(userInfo?.profileImage || "");
  const onboardMutation = useOnboardUser();

  const onBoardUserHandle = async () => {
    const email = userInfo?.email;
    try {
      if (!email) { showToast.error("No email found for this account."); return; }
      if (!name?.trim()) { showToast.error("Please enter your name."); return; }
      onboardMutation.mutate(
        { email, name: name.trim(), about: about || "", image },
        {
          onSuccess: (data) => {
            if (data?.status && data?.user) {
              setUserInfo({
                id: String(data.user.id),
                name: data.user.name,
                email: data.user.email,
                profileImage: data.user.image,
                about: data.user.about
              });
              showToast.success("Setup complete! Welcome to Vago Connect.");
              router.push("/");
            } else {
              showToast.error("Failed to complete setup. Please try again.");
            }
          },
          onError: (error) => {
            console.error("Onboarding failed:", error);
            showToast.error("Something went wrong. Please try again.");
          },
        }
      );
    } catch (error) {
      console.error("Onboarding error:", error);
      showToast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <ProtectedRoute>
      <div className="bg-ancient-bg-dark min-h-screen w-full flex flex-col items-center justify-center px-2 sm:px-8 py-6 sm:py-12 animate-fade-in">
        <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 text-ancient-text-light mb-6 sm:mb-8 animate-fade-in-up">
          <GiCrystalBall className="text-4xl sm:text-6xl md:text-8xl text-ancient-icon-glow drop-shadow-lg animate-float-slow" />
          <span className="text-3xl sm:text-5xl md:text-6xl font-bold font-serif select-none text-center tracking-wide drop-shadow-xl leading-tight px-1">
            Finish setting up your profile
          </span>
          <p className="text-ancient-text-muted text-xs sm:text-base md:text-lg text-center max-w-xs sm:max-w-lg md:max-w-xl px-2">
            Add your name and an optional about to complete your profile.
          </p>
        </div>

        {/* Onboarding Form */}
        <div className="
          bg-ancient-bg-medium w-full max-w-[95vw] sm:max-w-2xl p-5 sm:p-10
          rounded-xl shadow-2xl border border-ancient-border-stone
          flex flex-col md:flex-row items-center gap-6 sm:gap-8 lg:gap-12
          animate-zoom-in
        ">
          {/* Input Fields */}
          <div className="flex flex-col items-center justify-center gap-5 sm:gap-8 w-full md:w-2/3">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-ancient-text-light mb-2">Your profile</h2>
            <ThemedInput
              name="Name"
              state={name}
              setState={setName}
              label
              placeholder="Enter your name..."
              Icon={GiScrollQuill}
            />
            <ThemedInput
              name="About"
              state={about}
              setState={setAbout}
              label
              placeholder="Tell people about yourself (optional)"
              Icon={GiFeather}
            />
            <button
              onClick={onBoardUserHandle}
              disabled={onboardMutation.isPending}
              className="
                bg-ancient-icon-glow hover:bg-ancient-bubble-user-light text-ancient-bg-dark font-bold
                text-lg sm:text-xl px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg shadow-lg
                transform hover:scale-105 transition-all duration-300 flex items-center gap-2 sm:gap-3
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {onboardMutation.isPending ? (
                <LoadingSpinner label="Saving..." size={24} />
              ) : (
                <>
                  Save and continue
                  <FaMagic className="text-xl sm:text-2xl" />
                </>
              )}
            </button>
          </div>

          {/* Avatar Section */}
          <div className="
            flex flex-col items-center gap-3 sm:gap-4 w-full md:w-1/3
            mt-8 md:mt-0
          ">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-ancient-text-light mb-2 md:hidden">Profile picture</h2>
            <Avatar
              type="xl"
              image={image}
              setImage={setImage}
            />
            <p className="text-ancient-text-muted text-xs sm:text-sm text-center max-w-[170px] sm:max-w-[200px] mt-2">Choose a profile picture.</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default Onboarding;
