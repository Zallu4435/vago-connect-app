import React, { useState, useRef, useEffect } from "react";
import { BsEmojiSmile } from "react-icons/bs";
import { ImAttachment } from "react-icons/im";
import { MdSend } from "react-icons/md";
import { FaMicrophone } from "react-icons/fa";
import { useStateProvider } from "@/context/StateContext";
import axios from "axios";
import { ADD_MESSAGE_ROUTE, ADD_IMAGE_ROUTE } from "@/utils/ApiRoutes";
import { reducerCases } from "@/context/constants";
import EmojiPicker from "emoji-picker-react";
import dynamic from "next/dynamic";

const CaptureAudio = dynamic(() => import("../common/CaptureAudio"), { ssr: false })

function MessageBar() {
  const [{ userInfo, currentChatUser, messages, socket }, dispatch] = useStateProvider();
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAudioRecords, setShowAudioRecords] = useState(false);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);


  useEffect(() => {
    const handleOutsideClick = (event) => {
      if(event.target.id !== 'emojiopen') {
        if(emojiPickerRef.current  && !emojiPickerRef.current.contains(event.target)) {
          setShowEmojiPicker(false);
        }
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const handleEmojiModal = () => setShowEmojiPicker((v) => !v);

  const handleEmojiClick = (_e, emojiObject) => {
    const emoji = emojiObject?.emoji || _e?.emoji; // lib versions differ
    if (emoji) setMessage((prev) => prev + emoji);
  };

  const sendMessage = async () => {
    const text = message.trim();
    if (!text || !currentChatUser?.id || !userInfo?.id) return;
    try {
      const { data } = await axios.post(ADD_MESSAGE_ROUTE, {
        content: text,
        from: userInfo.id,
        to: currentChatUser.id,
        type: "text",
      });
      socket.current?.emit("send-msg", {
        to: currentChatUser.id,
        from: userInfo.id,
        message: data.content,
        type: "text",
      });
      dispatch({
        type: reducerCases.SET_MESSAGES,
        messages: [...(messages || []), data],
      });
      setMessage("");
    } catch (e) {
      console.error("sendMessage error", e);
    }
  }

  const onAttachmentClick = () => fileInputRef.current?.click();

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentChatUser?.id || !userInfo?.id) return;
    try {
      const form = new FormData();
      form.append("image", file);
      form.append("from", String(userInfo.id));
      form.append("to", String(currentChatUser.id));
      const { data } = await axios.post(ADD_IMAGE_ROUTE, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      socket.current?.emit("send-msg", {
        to: currentChatUser.id,
        from: userInfo.id,
        message: data.content,
      });
      dispatch({
        type: reducerCases.SET_MESSAGES,
        messages: [...(messages || []), data],
      });
    } catch (err) {
      console.error("sendImage error", err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-panel-header-background h-20 px-4 flex items-center gap-6 relative">
      {/* Emoji Icon */}
      <div className="flex gap-6">
        <BsEmojiSmile
          className="text-panel-header-icon cursor-pointer text-xl"
          title="Emoji"
          id="emoji-open"
          onClick={handleEmojiModal}
        />
      </div>
      {showEmojiPicker && (
        <div className="absolute bottom-20 right-4 z-50" ref={emojiPickerRef}>
          <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
        </div>
      )}
      {/* Attachment Icon */}
      <div className="flex gap-6">
        <ImAttachment
          className="text-panel-header-icon cursor-pointer text-xl"
          title="Attach File"
          onClick={onAttachmentClick}
        />
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelected}
        />
      </div>

      {/* Message Input */}
      <div className="w-full rounded-lg h-10 flex items-center">
        <input
          type="text"
          placeholder="Type a message"
          className="bg-input-background text-sm focus:outline-none text-white h-10 rounded-lg px-5 py-4 w-full"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {/* Send Button or Microphone */}
      <div className="flex w-10 items-center justify-center">
        {message.length > 0 ? (
          <MdSend
            className="text-panel-header-icon cursor-pointer text-xl"
            title="Send message"
            onClick={sendMessage}
          />
        ) : (
          <FaMicrophone
            className="text-panel-header-icon cursor-pointer text-xl"
            title="Record voice message"
            onClick={() => setShowAudioRecords(true)}
          />
        )}
      </div>
      {showAudioRecords && <CaptureAudio onChange={setShowAudioRecords} />}
    </div>
  );
}

export default MessageBar;
