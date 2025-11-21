"use client";
import React, { useEffect, useRef, useState } from "react";
import ChatList from "./Chatlist/ChatList";
import Empty from "./Empty"; // This component will need a thematic update
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/utils/FirebaseConfig";
import { useRouter } from "next/navigation";
import Chat from "./Chat/Chat"; // This component will need a thematic update
import SearchMessages from "./Chat/SearchMessages"; // This component has been themed
import VideoCall from "./Call/VideoCall"; // These call components will need thematic updates
import AudioCall from "./Call/AudioCall"; // These call components will need thematic updates
import { useAuthStore } from "@/stores/authStore";
import { useSocketStore } from "@/stores/socketStore";
import { useChatStore } from "@/stores/chatStore";
import { useCallStore } from "@/stores/callStore";
import { useUser } from "@/hooks/queries/useUser";
import ErrorMessage from "@/components/common/ErrorMessage"; // This component will need a thematic update
import FullPageError from "@/components/common/FullPageError"; // This component will need a thematic update
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
  const setMessages = useChatStore((s) => s.setMessages);
  const messageSearch = useChatStore((s) => s.messageSearch);

  const audioCall = useCallStore((s) => s.audioCall);
  const videoCall = useCallStore((s) => s.videoCall);
  const setCall = useCallStore((s) => s.setCall);
  const setAudioCall = useCallStore((s) => s.setAudioCall);
  const setVideoCall = useCallStore((s) => s.setVideoCall);

  const router = useRouter();
  useSocketConnection();
  useCallSocketHandlers();
  useMessageSocketHandlers();
  usePresenceSocketHandlers();

  // Opt-in to socket connection for this page
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

  // Removed non-paginated messages fetching and mark-read loop to avoid duplicate API calls.
  // ChatContainer uses useMessagesPaginated with markRead on initial page.

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
          title="Failed to decipher ancient prophecy" // Themed title
          message="The sacred scrolls are unreadable. Verify your connection to the ethereal plane and attempt again." // Themed message
          onRetry={() => refetchUser()}
          actionHref="/login"
          actionLabel="Return to Login Ritual" // Themed button
        />
      )}

      {/* Call Overlays */}
      {videoCall && <VideoCall />}
      {audioCall && <AudioCall />}

      {/* Main Chat Layout */}
      {!audioCall && !videoCall && (
        <div className="grid grid-cols-main h-screen w-screen max-h-screen max-w-full overflow-hidden bg-ancient-bg-dark text-ancient-text-light">
          {/* Chat List Sidebar */}
          {/* Defer ChatList until CHECK_USER completes so protected contacts endpoint has auth */}
          {isUserLoading ? (
            <div className="bg-ancient-bg-dark flex flex-col h-screen max-h-screen w-full lg:w-[400px] overflow-hidden border-r border-ancient-border-stone z-20 shadow-xl items-center justify-center text-ancient-text-muted">
              <LoadingSpinner label="Preparing your chats…" />
            </div>
          ) : (
            <ChatList />
          )}

          {/* Main Chat Area or Empty State */}
          {currentChatUser ? (
            <div className={`flex flex-col flex-1 ${messageSearch ? 'lg:mr-[400px]' : ''}`}>
              {/* Message Loading Error */}
              {false && (
                <div className="col-span-full px-6 py-3 bg-ancient-bg-medium border-b border-ancient-border-stone flex items-center gap-4 text-ancient-warning-text shadow-inner">
                  <ErrorMessage message="Failed to retrieve ancient whispers." />
                  <button
                    type="button"
                    className="bg-ancient-icon-glow hover:bg-ancient-bubble-user-light text-ancient-bg-dark text-sm px-4 py-2 rounded-lg transition-colors shadow-md"
                    onClick={() => {}}
                  >
                    Retry Invocation
                  </button>
                </div>
              )}
              {/* Chat Window */}
              <Chat isOnline={isOnline} />
              {/* Message Search Panel */}
              {messageSearch && <SearchMessages />}
            </div>
          ) : (
            // Empty State
            <Empty />
          )}
        </div>
      )}
    </>
  );
}

export default Main;