import React, { useState, useEffect } from "react";
import { BiArrowBack } from "react-icons/bi";
import { FaPen, FaCheck } from "react-icons/fa";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { useUpdateProfile } from '@/hooks/auth/useUpdateProfile';
import Avatar from "../common/Avatar";
import { getAbsoluteUrl } from "@/lib/url";
import AnimatedPanel from "@/components/common/AnimatedPanel";

export default function ProfileView({ open = true }) {
    const setActivePage = useChatStore((s) => s.setActivePage);
    const userInfo = useAuthStore((s) => s.userInfo);
    const updateProfileMutation = useUpdateProfile();
    const updateProfile = updateProfileMutation.mutateAsync;

    const [image, setImage] = useState("");

    const [name, setName] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);

    const [about, setAbout] = useState("");
    const [isEditingAbout, setIsEditingAbout] = useState(false);

    useEffect(() => {
        if (userInfo) {
            setName(userInfo.name || "");
            setAbout(userInfo.about || "Available");
            setImage(getAbsoluteUrl(userInfo.profileImage || userInfo.image) || "");
        }
    }, [userInfo]);

    const handleSaveName = async () => {
        if (!name.trim()) return;
        setIsEditingName(false);
        if (name !== userInfo?.name) {
            await updateProfile({ userId: userInfo?.id, name });
        }
    };

    const handleSaveAbout = async () => {
        if (!about.trim()) return;
        setIsEditingAbout(false);
        if (about !== userInfo?.about) {
            await updateProfile({ userId: userInfo?.id, about });
        }
    };

    const handleAvatarChange = async (base64Image) => {
        setImage(base64Image); // Update UI optimistic
        try {
            const data = await updateProfile({ userId: userInfo?.id, profileImage: base64Image });
            if (data?.status && data?.user) {
                setImage(getAbsoluteUrl(data.user.profileImage || data.user.image) || "");
            }
        } catch (e) {
            if (userInfo) setImage(getAbsoluteUrl(userInfo.profileImage || userInfo.image) || "");
        }
    };

    return (
        <AnimatedPanel open={open} direction="left">
            {/* Header - Matched exactly to ChatListHeader */}
            <div className="
                h-14 sm:h-16 px-4 sm:px-5 py-2 sm:py-3
                flex items-center gap-6
                bg-ancient-bg-medium border-b border-ancient-border-stone shadow-md shrink-0
            ">
                <button
                    onClick={() => setActivePage("default")}
                    className="text-ancient-icon-inactive hover:text-ancient-icon-glow transition flex items-center"
                >
                    <BiArrowBack className="text-xl sm:text-2xl" />
                </button>
                <span className="text-ancient-text-light font-medium text-lg sm:text-xl">Profile</span>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center">

                <div className="pt-8 pb-10 flex justify-center w-full">
                    <Avatar type="xl" image={image} setImage={handleAvatarChange} isLoading={updateProfileMutation.isPending} />
                </div>

                {/* Info Fields Container */}
                <div className="w-full bg-ancient-bg-dark flex flex-col">

                    {/* Your Name */}
                    <div className="px-7 py-3 mb-2">
                        <h3 className="text-ancient-icon-glow text-[13px] mb-2 font-medium">Your name</h3>
                        <div className="flex items-center justify-between gap-4">
                            {isEditingName ? (
                                <div className="flex-1 flex items-center border-b-2 border-ancient-icon-glow pb-1">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-transparent text-ancient-text-light text-[17px] focus:outline-none"
                                        maxLength={25}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                    />
                                    <button onClick={handleSaveName} className="text-ancient-icon-inactive hover:text-ancient-icon-glow pl-2">
                                        <FaCheck />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span className="text-ancient-text-light text-[17px] truncate flex-1">{name}</span>
                                    <button onClick={() => setIsEditingName(true)} className="text-ancient-icon-inactive hover:text-ancient-text-light p-1">
                                        <FaPen className="text-[17px]" />
                                    </button>
                                </>
                            )}
                        </div>
                        {!isEditingName && (
                            <div className="text-[13px] text-ancient-text-muted mt-2">
                                This is not your username or pin. This name will be visible to your WhatsApp clone contacts.
                            </div>
                        )}
                    </div>

                    {/* About */}
                    <div className="px-7 py-3 mt-2">
                        <h3 className="text-ancient-icon-glow text-[13px] mb-2 font-medium">About</h3>
                        <div className="flex items-center justify-between gap-4">
                            {isEditingAbout ? (
                                <div className="flex-1 flex items-center border-b-2 border-ancient-icon-glow pb-1">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={about}
                                        onChange={(e) => setAbout(e.target.value)}
                                        className="w-full bg-transparent text-ancient-text-light text-[17px] focus:outline-none"
                                        maxLength={139}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveAbout()}
                                    />
                                    <button onClick={handleSaveAbout} className="text-ancient-icon-inactive hover:text-ancient-icon-glow pl-2">
                                        <FaCheck />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span className="text-ancient-text-light text-[17px] truncate flex-1">{about}</span>
                                    <button onClick={() => setIsEditingAbout(true)} className="text-ancient-icon-inactive hover:text-ancient-text-light p-1">
                                        <FaPen className="text-[17px]" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </AnimatedPanel>
    );
}
