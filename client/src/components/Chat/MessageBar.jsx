import React, { useState, useRef, useEffect } from "react";
import { BsEmojiSmile } from "react-icons/bs";
import { ImAttachment } from "react-icons/im";
import { MdSend } from "react-icons/md";
import { FaMicrophone } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import dynamic from "next/dynamic";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useSocketStore } from "@/stores/socketStore";
import { useSendMessage } from "@/hooks/mutations/useSendMessage";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useUploadImage } from "@/hooks/mutations/useUploadImage";
import { showToast } from "@/lib/toast";

const CaptureAudio = dynamic(() => import("../common/CaptureAudio"), { ssr: false })

function MessageBar({ isOnline = true }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const messages = useChatStore((s) => s.messages);
  const setMessages = useChatStore((s) => s.setMessages);
  const socket = useSocketStore((s) => s.socket);
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAudioRecords, setShowAudioRecords] = useState(false);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const sendMessageMutation = useSendMessage();
  const uploadImageMutation = useUploadImage();


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

  const sendMessage = () => {
    if (!isOnline) return;
    const text = message.trim();
    if (!text || !currentChatUser?.id || !userInfo?.id) return;
    sendMessageMutation.mutate(
      { from: userInfo.id, to: currentChatUser.id, content: text, type: "text" },
      {
        onSuccess: (data) => {
          socket.current?.emit("send-msg", {
            to: currentChatUser.id,
            from: userInfo.id,
            message: data.content,
            type: data.type || "text",
            messageId: data.id,
          });
          // Optimistically reflect in UI immediately
          setMessages([...(messages || []), data]);
          setMessage("");
        },
        onError: (e) => {
          console.error("sendMessage error", e);
        },
      }
    );
  }

  const onAttachmentClick = () => {
    if (!isOnline) return;
    fileInputRef.current?.click();
  }

  const handleFileSelected = async (e) => {
    if (!isOnline) return;
    const file = e.target.files?.[0];
    if (!file || !currentChatUser?.id || !userInfo?.id) return;
    const form = new FormData();
    form.append("image", file);
    form.append("from", String(userInfo.id));
    form.append("to", String(currentChatUser.id));
    const toastId = showToast.loading("Uploading image...");
    uploadImageMutation.mutate(form, {
      onSuccess: (data) => {
        showToast.dismiss(toastId);
        showToast.success("Image sent");
        socket.current?.emit("send-msg", {
          to: currentChatUser.id,
          from: userInfo.id,
          message: data.content,
          type: data.type || "image",
          messageId: data.id,
        });
        setMessages([...(messages || []), data]);
      },
      onSettled: () => {
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      onError: (err) => {
        showToast.dismiss(toastId);
        showToast.error("Upload failed. Try again");
        console.error("sendImage error", err);
      },
    });
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
            style={{ opacity: (!isOnline || sendMessageMutation.isPending) ? 0.5 : 1, pointerEvents: (!isOnline || sendMessageMutation.isPending) ? "none" : "auto" }}
          />
        ) : (
          <FaMicrophone
            className="text-panel-header-icon cursor-pointer text-xl"
            title="Record voice message"
            onClick={() => setShowAudioRecords(true)}
            style={{ opacity: !isOnline ? 0.5 : 1, pointerEvents: !isOnline ? "none" : "auto" }}
          />
        )}
      </div>
      {sendMessageMutation.isError && (
        <div className="absolute bottom-24 right-4">
          <ErrorMessage message="Failed to send. Please try again." />
        </div>
      )}
      {showAudioRecords && <CaptureAudio onChange={setShowAudioRecords} />}
    </div>
  );
}

export default MessageBar;
