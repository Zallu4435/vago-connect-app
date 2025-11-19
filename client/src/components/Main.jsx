"use client";
import React, { useEffect, useRef, useState } from "react";
import ChatList from "./Chatlist/ChatList";
import Empty from "./Empty"; // This component will need a thematic update
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/utils/FirebaseConfig";
import { HOST } from "@/utils/ApiRoutes";
import { useRouter } from "next/navigation";
import Chat from "./Chat/Chat"; // This component will need a thematic update
import { io } from "socket.io-client";
import SearchMessages from "./Chat/SearchMessages"; // This component has been themed
import VideoCall from "./Call/VideoCall"; // These call components will need thematic updates
import AudioCall from "./Call/AudioCall"; // These call components will need thematic updates
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useCallStore } from "@/stores/callStore";
import { useSocketStore } from "@/stores/socketStore";
import { useQueryClient } from "@tanstack/react-query";
import { createSocketQuerySync } from "@/lib/socketQuerySync";
import { useUser } from "@/hooks/queries/useUser";
import ErrorMessage from "@/components/common/ErrorMessage"; // This component will need a thematic update
import { useMessages } from "@/hooks/queries/useMessages";
import FullPageError from "@/components/common/FullPageError"; // This component will need a thematic update
import { useUpdateMessageStatus } from "@/hooks/mutations/useUpdateMessageStatus";
import useNetworkStatus from "@/hooks/useNetworkStatus";
import { showToast } from "@/lib/toast";

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

  const setSocket = useSocketStore((s) => s.setSocket);
  const socket = useSocketStore((s) => s.socket);
  const router = useRouter();
  const socketRef = useRef(null);
  const connectionToastId = useRef(null);
  const [socketEvent, setSocketEvent] = useState(false);
  const queryClient = useQueryClient();
  const socketSync = createSocketQuerySync(queryClient);

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

  const { data: foundUser, error: userError, refetch: refetchUser } = useUser(authEmail || undefined);
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

  const { data: queriedMessages, error: messagesError, refetch: refetchMessages } = useMessages(
    userInfo?.id,
    currentChatUser?.id
  );
  useEffect(() => {
    if (queriedMessages) setMessages(queriedMessages);
  }, [queriedMessages, setMessages]);

  const updateMsgStatus = useUpdateMessageStatus();
  useEffect(() => {
    if (!queriedMessages || !userInfo?.id || !currentChatUser?.id) return;
    const unreadFromPeer = (queriedMessages || []).filter(
      (m) => m.senderId === Number(currentChatUser.id) && m.messageStatus !== "read"
    );
    unreadFromPeer.slice(0, 50).forEach((m) => {
      updateMsgStatus.mutate({ messageId: m.id, status: "read" });
    });
  }, [queriedMessages, userInfo?.id, currentChatUser?.id]);

  useEffect(() => {
    if (userInfo && !socket.current) { // Only initialize socket if not already present
      socketRef.current = io(HOST);
      setSocket(socketRef);
      socketRef.current.emit("add-user", userInfo.id);
    }
  }, [userInfo, setSocket, socket.current]);

  useEffect(() => {
    if (socket.current && !socketEvent) {
      socket.current.on("msg-recieve", (data) => {
        const normalized = {
          id: data.messageId, // Use actual messageId from backend
          content: data.message,
          type: data.type || "text",
          senderId: Number(data.from),
          receiverId: userInfo?.id ? Number(userInfo.id) : undefined,
          timestamp: new Date().toISOString(),
          messageStatus: "delivered", // Set initial status
        };
        socketSync.onMessageReceive(normalized, userInfo?.id, currentChatUser?.id);
        useChatStore.getState().addMessage(normalized);
      });

      socket.current.on("message-status-update", ({ messageId, status }) => {
        socketSync.onMessageStatusUpdate(messageId, status);
      });

      socket.current.on("message-edited", ({ messageId, newContent, editedAt }) => {
        socketSync.onMessageEdited(messageId, newContent, editedAt);
      });
      socket.current.on("message-deleted", ({ messageId, deleteType, deletedBy }) => {
        socketSync.onMessageDeleted(messageId, deleteType, { deletedBy });
      });
      socket.current.on("message-reacted", ({ messageId, reactions }) => {
        socketSync.onMessageReacted(messageId, reactions || []);
      });
      socket.current.on("message-starred", ({ messageId, starred }) => {
        socketSync.onMessageStarred(messageId, starred, userInfo?.id);
      });
      socket.current.on("message-forwarded", (payload) => {
        socketSync.onMessageForwarded(payload);
      });

      socket.current.on("incoming-call", (data) => {
        useCallStore.getState().setCall(data);
        if (data?.callType === "audio") useCallStore.getState().setAudioCall(true);
        if (data?.callType === "video") useCallStore.getState().setVideoCall(true);
      });
      socket.current.on("call-accepted", () => {
        useCallStore.getState().acceptCall();
      });
      socket.current.on("call-rejected", () => {
        useCallStore.getState().rejectCall();
        useCallStore.getState().endCall();
      });
      socket.current.on("call-ended", () => {
        useCallStore.getState().endCall();
      });
      socket.current.on("call-busy", () => {
        showToast.info("User is busy with another ritual."); // Themed
      });
      socket.current.on("call-failed", () => {
        showToast.error("Call failed. The spirits are not listening."); // Themed
      });
      socket.current.on("online-users", (users) => {
        useChatStore.getState().setOnlineUsers(users || []);
        if (Array.isArray(users) && users.length > 0) {
          // This might need more sophisticated handling if users array is full list
          // For now, assuming it broadcasts who just came online effectively.
          // Or update all contacts if the socketSync handles broader updates.
        }
      });

      socket.current.on("disconnect", () => {
        connectionToastId.current = showToast.loading("Severed connection to the ethereal plane..."); // Themed
      });
      socket.current.on("connect", () => {
        if (connectionToastId.current) {
          showToast.dismiss(connectionToastId.current);
          connectionToastId.current = null;
        }
        showToast.success("Reconnected to the ethereal plane!"); // Themed
      });
      socket.current.on("connect_error", () => {
        if (connectionToastId.current) {
          showToast.dismiss(connectionToastId.current);
          connectionToastId.current = null;
        }
        showToast.error("Failed to connect to the ethereal plane."); // Themed
      });

      setSocketEvent(true);
    }
    return () => {
      // Cleanup socket event listeners
      if (socket.current) {
        socket.current.off("msg-recieve");
        socket.current.off("message-status-update");
        socket.current.off("message-edited");
        socket.current.off("message-deleted");
        socket.current.off("message-reacted");
        socket.current.off("message-starred");
        socket.current.off("message-forwarded");
        socket.current.off("incoming-call");
        socket.current.off("call-accepted");
        socket.current.off("call-rejected");
        socket.current.off("call-ended");
        socket.current.off("call-busy");
        socket.current.off("call-failed");
        socket.current.off("online-users");
        socket.current.off("disconnect");
        socket.current.off("connect");
        socket.current.off("connect_error");
      }
    };
  }, [socket.current, socketEvent, userInfo?.id, currentChatUser?.id, queryClient, socketSync]);


  return (
    <>
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
          <ChatList />

          {/* Main Chat Area or Empty State */}
          {currentChatUser ? (
            <div className={`flex flex-col flex-1 ${messageSearch ? 'lg:mr-[400px]' : ''}`}>
              {/* Message Loading Error */}
              {messagesError && (
                <div className="col-span-full px-6 py-3 bg-ancient-bg-medium border-b border-ancient-border-stone flex items-center gap-4 text-ancient-warning-text shadow-inner">
                  <ErrorMessage message="Failed to retrieve ancient whispers." />
                  <button
                    type="button"
                    className="bg-ancient-icon-glow hover:bg-ancient-bubble-user-light text-ancient-bg-dark text-sm px-4 py-2 rounded-lg transition-colors shadow-md"
                    onClick={() => refetchMessages()}
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