"use client";
import React, { useEffect, useRef, useState } from "react";
import ChatList from "./Chatlist/ChatList";
import Empty from "./Empty";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/utils/FirebaseConfig";
import { useRouter } from "next/navigation";
import Chat from "./Chat/Chat";
import SearchMessages from "./Chat/SearchMessages";
import VideoCall from "./Call/VideoCall";
import AudioCall from "./Call/AudioCall";
import { useAuthStore } from "@/stores/authStore";
import { useSocketStore } from "@/stores/socketStore";
import { useChatStore } from "@/stores/chatStore";
import { useCallStore } from "@/stores/callStore";
import { useUser } from "@/hooks/queries/useUser";
import FullPageError from "@/components/common/FullPageError";
import useNetworkStatus from "@/hooks/useNetworkStatus";
import { useSocketConnection } from "@/hooks/useSocketConnection";
import { useCallSocketHandlers } from "@/hooks/useCallSocketHandlers";
import { useMessageSocketHandlers } from "@/hooks/useMessageSocketHandlers";
import { usePresenceSocketHandlers } from "@/hooks/usePresenceSocketHandlers";
import LoadingSpinner from "@/components/common/LoadingSpinner";

function Main() {
  const isOnline = useNetworkStatus();
  const userInfo = useAuthStore((s) => s.userInfo);
  const setUserInfo = useAuthStore((s) => s.setUserInfo);
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const messageSearch = useChatStore((s) => s.messageSearch);

  const audioCall = useCallStore((s) => s.audioCall);
  const videoCall = useCallStore((s) => s.videoCall);

  const router = useRouter();
  useSocketConnection();
  useCallSocketHandlers();
  useMessageSocketHandlers();
  usePresenceSocketHandlers();

  const setShouldConnect = useSocketStore((s) => s.setShouldConnect);
  useEffect(() => {
    setShouldConnect(true);
    return () => setShouldConnect(false);
  }, [setShouldConnect]);

  const [authEmail, setAuthEmail] = useState("");
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [authPhotoURL, setAuthPhotoURL] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      const email = currentUser.email || "";
      setAuthEmail(email);
      setAuthDisplayName(currentUser.displayName || "");
      setAuthPhotoURL(currentUser.photoURL || "");
    });
    return () => unsub();
  }, [router]);

  const { data: foundUser, error: userError, refetch: refetchUser, isPending: isUserLoading } = useUser(authEmail || undefined);

  useEffect(() => {
    if (!authEmail) return;
    if (foundUser === null) {
      if (!userInfo?.id) {
        setUserInfo({
          id: "",
          name: authDisplayName,
          email: authEmail,
          profileImage: authPhotoURL,
          about: "",
        });
        router.push("/onboarding");
      }
    } else if (foundUser) {
      setUserInfo(foundUser);
    }
  }, [authEmail, foundUser, authDisplayName, authPhotoURL, setUserInfo, router, userInfo?.id]);

  return (
    <>
      {/* SVG filter defs for organic message bubble effect */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id="organic-blob">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      {/* Full Page Error for User Loading */}
      {authEmail && userError && (
        <FullPageError
          title="Failed to decipher ancient prophecy"
          message="The sacred scrolls are unreadable. Verify your connection to the ethereal plane and attempt again."
          onRetry={() => refetchUser()}
          actionHref="/login"
          actionLabel="Return to Login Ritual"
        />
      )}

      {/* Call Overlays */}
      {videoCall && <VideoCall />}
      {audioCall && <AudioCall />}

      {/* Main Chat Layout */}
      {!audioCall && !videoCall && (
        <div className="
          flex flex-col md:flex-row
          h-dvh w-dvw max-h-screen max-w-full overflow-hidden
          bg-ancient-bg-dark text-ancient-text-light
        ">
          {/* Sidebar/Chat List */}
          <div className={`
            flex-shrink-0 w-full md:w-[340px] lg:w-[400px]
            h-screen md:h-screen max-h-screen md:max-h-full
            border-b md:border-b-0 md:border-r border-ancient-border-stone
            shadow-xl z-20 bg-ancient-bg-dark
            relative
            transition-all
            md:sticky md:top-0
            ${currentChatUser ? 'hidden' : 'block'} md:block
          `}>
            {isUserLoading ? (
              <div className="flex flex-col h-full w-full items-center justify-center text-ancient-text-muted">
                <LoadingSpinner label="Preparing your chats…" />
              </div>
            ) : (
              <ChatList />
            )}
          </div>
          {/* Main Chat Area or Empty State */}
          <div className={`flex-1 min-w-0 flex flex-col ${currentChatUser ? 'block' : 'hidden'} md:block`}>
            {currentChatUser ? (
              <div className={`flex flex-col flex-1 w-full max-w-full h-full`}>
                {/* Message Loading Error Placeholder */}
                {/* ... */}
                <Chat isOnline={isOnline} />
                {/* Search panel overlays chat, if active */}
                {messageSearch && (
                  <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-lg animate-fade-in">
                    <div className="max-w-2xl w-full mx-auto my-12 md:my-20">
                      <SearchMessages />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Empty State
              <Empty />
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Main;
