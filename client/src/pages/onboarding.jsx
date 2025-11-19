import React, { useState } from "react";
import Input from "@/components/common/Input"; // This will need its own thematic update
import Avatar from "@/components/common/Avatar"; // This will need its own thematic update
import { useRouter } from "next/router";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardUser } from "@/hooks/mutations/useOnboardUser";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { GiCrystalBall, GiFeather, GiScrollQuill } from "react-icons/gi"; // Importing mystical icons
import { FaMagic } from "react-icons/fa";
import { showToast } from "@/lib/toast";

function Onboarding() {
  const userInfo = useAuthStore((s) => s.userInfo);
  const setUserInfo = useAuthStore((s) => s.setUserInfo);
  const router = useRouter();
  const [name, setName] = useState(userInfo?.name || "");
  const [about, setAbout] = useState("");
  const [image, setImage] = useState("/default_mystical_avatar.png"); // Themed default avatar
  const onboardMutation = useOnboardUser();
  
  const onBoardUserHandle = async () => {
    const email = userInfo?.email;
    try {
      if (!email) {
        showToast.error("No spirit essence (email) found for this ritual.");
        return;
      }
      if (!name?.trim()) {
        showToast.error("A name must be inscribed in the ancient records.");
        return;
      }

      onboardMutation.mutate(
        { email, name: name.trim(), about: about || "", image },
        {
          onSuccess: (data) => {
            if (data?.status && data?.user) {
              setUserInfo({ id: String(data.user.id), name: data.user.name, email: data.user.email, profileImage: data.user.image, about: data.user.about });
              showToast.success("Initiation complete! Welcome to the Ethereal Whispers.");
              router.push("/");
            } else {
              showToast.error("Failed to complete the ancient initiation. Unknown decree.");
            }
          },
          onError: (error) => {
            console.error("Onboarding ritual failed:", error);
            showToast.error("The ancient ritual encountered an unforeseen disturbance. Try again.");
          },
        }
      );
    } catch (error) {
      console.error("Critical onboarding error:", error);
      showToast.error("A cosmic anomaly prevented the initiation. Report to the High Council.");
    }
  }

  return (
    <ProtectedRoute>
      <div className="bg-ancient-bg-dark h-screen w-screen flex flex-col items-center justify-center p-8 animate-fade-in">
        {/* Themed Header */}
        <div className="flex flex-col items-center justify-center gap-6 text-ancient-text-light mb-8 animate-fade-in-up">
          <GiCrystalBall className="text-9xl text-ancient-icon-glow drop-shadow-lg animate-float-slow" />
          <span className="text-6xl font-bold font-serif select-none text-center tracking-wide drop-shadow-xl leading-tight">
            The Initiation Ritual
          </span>
          <p className="text-ancient-text-muted text-lg italic text-center max-w-xl">
            Unveil your essence to the ethereal plane. This is where your journey into the sacred communion begins.
          </p>
        </div>

        {/* Onboarding Form */}
        <div className="bg-ancient-bg-medium p-10 rounded-xl shadow-2xl border border-ancient-border-stone flex flex-col lg:flex-row items-center gap-12 animate-zoom-in">
          {/* Input Fields */}
          <div className="flex flex-col items-center justify-center gap-8">
            <h2 className="text-3xl font-bold text-ancient-text-light mb-2">Inscribe Your True Self</h2>
            
            <Input 
              name="Mystic Moniker" // Themed label
              state={name} 
              setState={setName} 
              label
              placeholder="Enter your mystical name..." // Themed placeholder
              Icon={GiScrollQuill} // Themed icon for input
            />
            <Input 
              name="Ancient Saga" // Themed label
              state={about} 
              setState={setAbout} 
              label
              placeholder="Share a whisper of your ancient lore..." // Themed placeholder
              Icon={GiFeather} // Themed icon for input
            />
            <button 
              onClick={onBoardUserHandle} 
              className="bg-ancient-icon-glow hover:bg-ancient-bubble-user-light text-ancient-bg-dark font-bold text-xl px-8 py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
            >
              Forge Destiny
              <FaMagic className="text-2xl" />
            </button>
          </div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-3xl font-bold text-ancient-text-light mb-2 lg:hidden">Unveil Your Visage</h2>
            <Avatar type="xl" image={image} setImage={setImage} defaultImage="/default_mystical_avatar.png" /> {/* Themed default image prop */}
            <p className="text-ancient-text-muted text-sm text-center max-w-[200px] mt-2">
              Choose an emblem for your ethereal presence.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default Onboarding;