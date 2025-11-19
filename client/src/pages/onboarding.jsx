import React, { useState } from "react";
import Image from "next/image";
import Input from "@/components/common/Input";
import Avatar from "@/components/common/Avatar";
import { ONBOARD_USER_ROUTE } from "@/utils/ApiRoutes";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { useOnboardUser } from "@/hooks/mutations/useOnboardUser";

function Onboarding() {
  const userInfo = useAuthStore((s) => s.userInfo);
  const setUserInfo = useAuthStore((s) => s.setUserInfo);
  const router = useRouter();
  const [name, setName] = useState(userInfo?.name || "");
  const [about, setAbout] = useState("");
  const [image, setImage] = useState("/default_avatar.png");
  const onboardMutation = useOnboardUser();
  
  const onBoardUserHandle = async () => {
    const email = userInfo?.email;
    try {
      if (!email || !name?.trim()) return;
      onboardMutation.mutate(
        { email, name: name.trim(), about: about || "", image },
        {
          onSuccess: (data) => {
            if (data?.status && data?.user) {
              setUserInfo({ id: String(data.user.id), name: data.user.name, email: data.user.email, profileImage: data.user.image, about: data.user.about });
              router.push("/");
            }
          },
        }
      );
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="bg-panel-header-background h-screen w-screen flex text-white flex-col items-center justify-center">
      <div className="flex items-center justify-center gap-2 text-white">
        <Image src="/whatsapp.gif" alt="Whatsapp" height={300} width={300} />
        <span className="text-7xl">Whatsapp</span>
      </div>

      <h2 className="text-2xl">Create your account</h2>
      
      <div className="flex gap-6 mt-6">
        <div className="flex flex-col items-center justify-center mt-5 gap-6">
          <Input name="Display Name" state={name} setState={setName} label/>
          <Input name="About" state={about} setState={setAbout} label/>
          <button onClick={onBoardUserHandle} className="bg-teal-600 hover:bg-teal-500 px-5 py-2 rounded-lg">Continue</button>
        </div>
        <div>
          <Avatar type="xl" image={image} setImage={setImage} />
        </div>
      </div>
    </div>
  )
}

export default Onboarding;
