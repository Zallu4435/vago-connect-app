"use client";
import React, { useEffect, useRef, useState } from "react";
import ChatList from "./Chatlist/ChatList";
import Empty from "./Empty";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/utils/FirebaseConfig";
import axios from "axios";
import { CHECK_USER_ROUTE, GET_MESSAGES_ROUTE, HOST } from "@/utils/ApiRoutes";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import { useRouter } from "next/navigation";
import Chat from "./Chat/Chat";
import { io } from "socket.io-client";
import SearchMessages from "./Chat/SearchMessages";
import VideoCall from "./Call/VideoCall";
import AudioCall from "./Call/AudioCall";

function Main() {
  const [{ userInfo, currentChatUser, messageSearch, audioCall, videoCall, call }, dispatch] = useStateProvider();
  const router = useRouter();
  const socket = useRef(null);
  const [socketEvent, setSocketEvent] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      try {
        if (!currentUser) {
          router.push("/login");
          return;
        }

        const email = currentUser.email;
        if (!email) return;

        const { data } = await axios.post(CHECK_USER_ROUTE, { email });

        if (!data?.status) {
          dispatch({ type: reducerCases.SET_NEW_USER, newUser: true });
          dispatch({
            type: reducerCases.SET_USER_INFO,
            userInfo: {
              name: currentUser.displayName || "",
              email,
              profileImage: currentUser.photoURL || "",
              status: "",
            },
          });
          router.push("/onboarding");
          return;
        }

        // Existing user
        dispatch({ type: reducerCases.SET_NEW_USER, newUser: false });
        if (data.user) {
          dispatch({
            type: reducerCases.SET_USER_INFO,
            userInfo: {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              profileImage: data.user.image,
              status: data.user.about,
            },
          });
        }
      } catch (err) {
        console.log(err);
      }
    });
    return () => unsub();
  }, [dispatch, router]);

  // Fetch messages whenever the selected chat changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!userInfo?.id || !currentChatUser?.id) return;
      try {
        const { data } = await axios.get(
          `${GET_MESSAGES_ROUTE}/${userInfo.id}/${currentChatUser.id}`
        );
        if (data?.messages) {
          dispatch({ type: reducerCases.SET_MESSAGES, messages: data.messages });
        }
      } catch (err) {
        console.error("getMessages error", err);
      }
    };
    fetchMessages();
  }, [userInfo?.id, currentChatUser?.id, dispatch]);

  useEffect(() => {
    if (userInfo) {
      socket.current = io(HOST);
      socket.current.emit("add-user", userInfo.id);
      dispatch({ type: reducerCases.SET_SOCKET, socket: socket });
    }
  }, [userInfo])

  useEffect(() => {
    if (socket.current && !socketEvent) {
      socket.current.on("msg-recieve", (data) => {
        // Normalize incoming payload to our message shape
        const normalized = {
          id: Date.now(),
          content: data.message,
          type: data.type || "text",
          senderId: data.from,
          receiverId: userInfo?.id,
          timestamp: new Date().toISOString(),
        };
        dispatch({ type: reducerCases.SET_NEW_MESSAGE, newMessage: normalized });
      });
      // call signaling
      socket.current.on("incoming-call", (data) => {
        dispatch({ type: reducerCases.SET_CALL, call: data });
        if (data?.callType === "audio") dispatch({ type: reducerCases.SET_AUDIO_CALL, audioCall: true });
        if (data?.callType === "video") dispatch({ type: reducerCases.SET_VIDEO_CALL, videoCall: true });
        dispatch({ type: reducerCases.SET_CALLING, calling: false });
      });
      socket.current.on("call-accepted", () => {
        dispatch({ type: reducerCases.SET_CALL_ACCEPTED, callAccepted: true });
      });
      socket.current.on("call-rejected", () => {
        dispatch({ type: reducerCases.SET_CALL_REJECTED, callRejected: true });
        dispatch({ type: reducerCases.SET_CALL_ENDED });
      });
      socket.current.on("call-ended", () => {
        dispatch({ type: reducerCases.SET_CALL_ENDED });
      });
      setSocketEvent(true);
    }
  }, [socket.current, socketEvent, userInfo?.id, dispatch]);

  return (
    <>
      {videoCall && <VideoCall />}
      {audioCall && <AudioCall />}
      {!audioCall && !videoCall && (
        <div className="grid grid-cols-main h-screen w-screen max-h-screen max-w-full overflow-hidden">
          <ChatList />
          {currentChatUser ? (
            <div className={messageSearch ? "grid grid-cols-2" : "grid-cols-2"}>
              <Chat />
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
