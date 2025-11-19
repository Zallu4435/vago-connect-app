"use client";
import React, { useEffect, useRef, useState } from "react";
import ChatList from "./Chatlist/ChatList";
import Empty from "./Empty";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/utils/FirebaseConfig";
import { HOST } from "@/utils/ApiRoutes";
import { useRouter } from "next/navigation";
import Chat from "./Chat/Chat";
import { io } from "socket.io-client";
import SearchMessages from "./Chat/SearchMessages";
import VideoCall from "./Call/VideoCall";
import AudioCall from "./Call/AudioCall";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useCallStore } from "@/stores/callStore";
import { useSocketStore } from "@/stores/socketStore";
import { useQueryClient } from "@tanstack/react-query";
import { createSocketQuerySync } from "@/lib/socketQuerySync";
import { useUser } from "@/hooks/queries/useUser";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useMessages } from "@/hooks/queries/useMessages";
import FullPageError from "@/components/common/FullPageError";
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
      // New user → seed minimal info and go to onboarding
      setUserInfo({
        id: "",
        name: authDisplayName,
        email: authEmail,
        profileImage: authPhotoURL,
        about: "",
      });
      router.push("/onboarding");
    } else if (foundUser) {
      setUserInfo(foundUser);
    }
  }, [authEmail, foundUser, authDisplayName, authPhotoURL, setUserInfo, router]);

  // Fetch messages via React Query and sync to Zustand
  const { data: queriedMessages, error: messagesError, refetch: refetchMessages } = useMessages(
    userInfo?.id,
    currentChatUser?.id
  );
  useEffect(() => {
    if (queriedMessages) setMessages(queriedMessages);
  }, [queriedMessages, setMessages]);

  // Mark unread messages from the peer as read when the chat loads
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
    if (userInfo) {
      socketRef.current = io(HOST);
      // set socket ref in store and emit add-user
      setSocket(socketRef);
      socketRef.current.emit("add-user", userInfo.id);
    }
  }, [userInfo, setSocket])

  useEffect(() => {
    if (socket.current && !socketEvent) {
      socket.current.on("msg-recieve", (data) => {
        const normalized = {
          id: Date.now(),
          content: data.message,
          type: data.type || "text",
          senderId: Number(data.from),
          receiverId: userInfo?.id ? Number(userInfo.id) : undefined,
          timestamp: new Date().toISOString(),
        };
        socketSync.onMessageReceive(normalized, userInfo?.id, currentChatUser?.id);
        useChatStore.getState().addMessage(normalized);
      });

      socket.current.on("message-status-update", ({ messageId, status }) => {
        socketSync.onMessageStatusUpdate(messageId, status);
      });

      // call signaling
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
        showToast.info("User is busy");
      });
      socket.current.on("call-failed", () => {
        showToast.error("Call failed. Try again");
      });
      socket.current.on("online-users", (users) => {
        useChatStore.getState().setOnlineUsers(users || []);
        if (Array.isArray(users) && users.length > 0) {
          socketSync.onUserOnline(users[users.length - 1]);
        }
      });

      // Socket connection status toasts
      socket.current.on("disconnect", () => {
        connectionToastId.current = showToast.loading("Connecting...");
      });
      socket.current.on("connect", () => {
        if (connectionToastId.current) {
          showToast.dismiss(connectionToastId.current);
          connectionToastId.current = null;
        }
        showToast.success("Connected");
      });
      socket.current.on("connect_error", () => {
        if (connectionToastId.current) {
          showToast.dismiss(connectionToastId.current);
          connectionToastId.current = null;
        }
        showToast.error("Connection failed");
      });

      setSocketEvent(true);
    }
    return () => {
      if (socket.current) {
        socket.current.off("disconnect");
        socket.current.off("connect");
        socket.current.off("connect_error");
        socket.current.off("call-busy");
        socket.current.off("call-failed");
      }
    };
  }, [socket.current, socketEvent, userInfo?.id, currentChatUser?.id, queryClient, socketSync]);

  return (
    <>
      {authEmail && userError && (
        <FullPageError
          title="Failed to load user"
          message="Please check your connection and try again."
          onRetry={() => refetchUser()}
          actionHref="/login"
          actionLabel="Back to Login"
        />
      )}
      {videoCall && <VideoCall />}
      {audioCall && <AudioCall />}
      {!audioCall && !videoCall && (
        <div className="grid grid-cols-main h-screen w-screen max-h-screen max-w-full overflow-hidden">
          <ChatList />
          {currentChatUser ? (
            <div className={messageSearch ? "grid grid-cols-2" : "grid-cols-2"}>
              {messagesError && (
                <div className="col-span-2 px-4 py-2 bg-search-input-container-background border-b border-conversation-border flex items-center gap-3">
                  <ErrorMessage message="Failed to load messages" />
                  <button
                    type="button"
                    className="bg-panel-header-background hover:bg-[#2b3942] text-white text-sm px-3 py-1 rounded"
                    onClick={() => refetchMessages()}
                  >
                    Retry
                  </button>
                </div>
              )}
              <Chat isOnline={isOnline} />
              {messageSearch && <SearchMessages />}
            </div>
          ) : (
            <Empty />
          )}
        </div>
      )}
    </>
  )
}

export default Main;
