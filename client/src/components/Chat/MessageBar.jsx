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
import { useUploadVideo } from "@/hooks/mutations/useUploadVideo";
import { useUploadFile } from "@/hooks/mutations/useUploadFile";
import { useSendLocation } from "@/hooks/mutations/useSendLocation";
import { api } from "@/lib/api";
import { ADD_IMAGE_ROUTE, ADD_VIDEO_ROUTE, ADD_FILE_ROUTE } from "@/utils/ApiRoutes";

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
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploadingLabel, setUploadingLabel] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const genericFileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const sendMessageMutation = useSendMessage();
  const uploadImageMutation = useUploadImage();
  const uploadVideoMutation = useUploadVideo();
  const uploadFileMutation = useUploadFile();
  const sendLocationMutation = useSendLocation();

  // Drag & drop and paste handlers with progress
  const uploadWithProgress = async (file) => {
    if (!file || !currentChatUser?.id || !userInfo?.id) return;
    const mime = file.type || "";
    const isImage = mime.startsWith("image/");
    const isVideo = mime.startsWith("video/");
    const endpoint = isImage ? ADD_IMAGE_ROUTE : isVideo ? ADD_VIDEO_ROUTE : ADD_FILE_ROUTE;
    const field = isImage ? "image" : isVideo ? "video" : "file";
    const form = new FormData();
    form.append(field, file);
    form.append("from", String(userInfo.id));
    form.append("to", String(currentChatUser.id));
    try {
      setUploadingLabel(isImage ? "Uploading image..." : isVideo ? "Uploading video..." : "Uploading file...");
      setUploadProgress(0);
      const { data } = await api.post(endpoint, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (!e.total) return;
          const pct = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(pct);
        },
      });
      socket.current?.emit("send-msg", {
        to: currentChatUser.id,
        from: userInfo.id,
        message: data.content,
        type: data.type || (isImage ? "image" : isVideo ? "video" : "document"),
        messageId: data.id,
      });
      setMessages([...(messages || []), data]);
    } catch (err) {
      showToast.error("Upload failed. Try again");
      console.error("uploadWithProgress error", err);
    } finally {
      setTimeout(() => { setUploadingLabel(""); setUploadProgress(0); }, 400);
    }
  };

  const onPaste = (e) => {
    if (!isOnline) return;
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      e.preventDefault();
      uploadWithProgress(files[0]);
    }
  };

  const onDrop = (e) => {
    if (!isOnline) return;
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      uploadWithProgress(files[0]);
    }
  };
  const onDragOver = (e) => { e.preventDefault(); };

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
    setShowAttachMenu((v) => !v);
  };

  const handleImageSelected = async (e) => {
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
        if (imageInputRef.current) imageInputRef.current.value = "";
      },
      onError: (err) => {
        showToast.dismiss(toastId);
        showToast.error("Upload failed. Try again");
        console.error("sendImage error", err);
      },
    });
  };

  const handleVideoSelected = async (e) => {
    if (!isOnline) return;
    const file = e.target.files?.[0];
    if (!file || !currentChatUser?.id || !userInfo?.id) return;
    const form = new FormData();
    form.append("video", file);
    form.append("from", String(userInfo.id));
    form.append("to", String(currentChatUser.id));
    const toastId = showToast.loading("Uploading video...");
    uploadVideoMutation.mutate(form, {
      onSuccess: (data) => {
        showToast.dismiss(toastId);
        showToast.success("Video sent");
        socket.current?.emit("send-msg", {
          to: currentChatUser.id,
          from: userInfo.id,
          message: data.content,
          type: data.type || "video",
          messageId: data.id,
        });
        setMessages([...(messages || []), data]);
      },
      onSettled: () => {
        if (videoInputRef.current) videoInputRef.current.value = "";
      },
      onError: (err) => {
        showToast.dismiss(toastId);
        showToast.error("Upload failed. Try again");
        console.error("sendVideo error", err);
      },
    });
  };

  const handleGenericFileSelected = async (e) => {
    if (!isOnline) return;
    const file = e.target.files?.[0];
    if (!file || !currentChatUser?.id || !userInfo?.id) return;
    const form = new FormData();
    form.append("file", file);
    form.append("from", String(userInfo.id));
    form.append("to", String(currentChatUser.id));
    const toastId = showToast.loading("Uploading file...");
    uploadFileMutation.mutate(form, {
      onSuccess: (data) => {
        showToast.dismiss(toastId);
        showToast.success("File sent");
        socket.current?.emit("send-msg", {
          to: currentChatUser.id,
          from: userInfo.id,
          message: data.content,
          type: data.type || "document",
          messageId: data.id,
        });
        setMessages([...(messages || []), data]);
      },
      onSettled: () => {
        if (genericFileInputRef.current) genericFileInputRef.current.value = "";
      },
      onError: (err) => {
        showToast.dismiss(toastId);
        showToast.error("Upload failed. Try again");
        console.error("sendFile error", err);
      },
    });
  };

  const handleSendLocation = () => {
    if (!isOnline || !currentChatUser?.id || !userInfo?.id) return;
    if (!navigator.geolocation) {
      showToast.error("Geolocation not supported");
      return;
    }
    const toastId = showToast.loading("Fetching location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords || {};
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
          showToast.dismiss(toastId);
          showToast.error("Failed to get location");
          return;
        }
        sendLocationMutation.mutate(
          { from: userInfo.id, to: currentChatUser.id, latitude, longitude },
          {
            onSuccess: (data) => {
              showToast.dismiss(toastId);
              showToast.success("Location sent");
              setMessages([...(messages || []), data]);
            },
            onError: () => {
              showToast.dismiss(toastId);
              showToast.error("Failed to send location");
            },
          }
        );
      },
      () => {
        showToast.dismiss(toastId);
        showToast.error("Location permission denied");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="bg-panel-header-background h-20 px-4 flex items-center gap-6 relative" onDrop={onDrop} onDragOver={onDragOver}>
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
      <div className="flex gap-6 relative">
        <ImAttachment
          className="text-panel-header-icon cursor-pointer text-xl"
          title="Attach"
          onClick={onAttachmentClick}
        />
        {showAttachMenu && (
          <div className="absolute bottom-12 left-0 z-50 bg-[#233138] border border-[#2a3942] rounded-md shadow-lg p-2 w-40">
            <button className="block w-full text-left px-2 py-1 hover:bg-[#2a3942]" onClick={() => imageInputRef.current?.click()}>Image</button>
            <button className="block w-full text-left px-2 py-1 hover:bg-[#2a3942]" onClick={() => videoInputRef.current?.click()}>Video</button>
            <button className="block w-full text-left px-2 py-1 hover:bg-[#2a3942]" onClick={() => genericFileInputRef.current?.click()}>File</button>
            <button className="block w-full text-left px-2 py-1 hover:bg-[#2a3942]" onClick={handleSendLocation}>Location</button>
          </div>
        )}
        {/* Hidden pickers */}
        <input type="file" accept="image/*" className="hidden" ref={imageInputRef} onChange={handleImageSelected} />
        <input type="file" accept="video/*" className="hidden" ref={videoInputRef} onChange={handleVideoSelected} />
        <input type="file" className="hidden" ref={genericFileInputRef} onChange={handleGenericFileSelected} />
      </div>

      {/* Message Input */}
      <div className="w-full rounded-lg h-10 flex items-center">
        <input
          type="text"
          placeholder="Type a message"
          className="bg-input-background text-sm focus:outline-none text-white h-10 rounded-lg px-5 py-4 w-full"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onPaste={onPaste}
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
      {uploadingLabel && (
        <div className="absolute -top-6 right-4 left-4 flex items-center gap-2">
          <span className="text-bubble-meta text-xs">{uploadingLabel}</span>
          <div className="flex-1 h-1 bg-[#1f2c33] rounded">
            <div className="h-1 bg-emerald-500 rounded" style={{ width: `${uploadProgress}%` }} />
          </div>
          <span className="text-bubble-meta text-xs">{uploadProgress}%</span>
        </div>
      )}
    </div>
  );
}

export default MessageBar;
