import React, { useState, useRef, useEffect } from "react";
import { BsEmojiSmile } from "react-icons/bs";
import { MdSend } from "react-icons/md";
import { FaMicrophone, FaCamera } from "react-icons/fa";
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
import AttachmentDropdown from "./AttachmentDropdown";
import ReplyPreview from "./ReplyPreview";

const CaptureAudio = dynamic(() => import("../common/CaptureAudio"), { ssr: false });

function MessageBar({ isOnline = true }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const messages = useChatStore((s) => s.messages);
  const setMessages = useChatStore((s) => s.setMessages);
  const replyTo = useChatStore((s) => s.replyTo);
  const clearReplyTo = useChatStore((s) => s.clearReplyTo);
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
  const inputRef = useRef(null);
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
    form.append(field, file, file.name || 'upload');
    form.append("from", String(userInfo.id));
    form.append("to", String(currentChatUser.id));
    try {
      setUploadingLabel(isImage ? "Invoking ancient image..." : isVideo ? "Conjuring video essence..." : "Transcribing ancient file...");
      setUploadProgress(0);
      const { data } = await api.post(endpoint, form, {
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
      showToast.error("Invocation failed. Try again.");
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
      if(event.target.id !== 'emoji-open') {
        if(emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
          setShowEmojiPicker(false);
        }
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  // Focus the input when a reply target is set
  useEffect(() => {
    if (replyTo && inputRef.current) {
      try { inputRef.current.focus(); } catch {}
    }
  }, [replyTo]);


  const handleEmojiModal = () => setShowEmojiPicker((v) => !v);

  const handleEmojiClick = (_e, emojiObject) => {
    const emoji = emojiObject?.emoji || _e?.emoji;
    if (emoji) setMessage((prev) => prev + emoji);
  };

  const sendMessage = () => {
    if (!isOnline) return;
    const text = message.trim();
    if (!text || !currentChatUser?.id || !userInfo?.id) return;
    sendMessageMutation.mutate(
      { from: userInfo.id, to: currentChatUser.id, content: text, type: "text", replyToId: replyTo?.id },
      {
        onSuccess: (data) => {
          socket.current?.emit("send-msg", {
            to: currentChatUser.id,
            from: userInfo.id,
            message: data.content,
            type: data.type || "text",
            messageId: data.id,
          });
          setMessages([...(messages || []), data]);
          setMessage("");
          if (replyTo) clearReplyTo();
        },
        onError: (e) => {
          console.error("sendMessage error", e);
          showToast.error("Failed to invoke message. Try again.");
        },
      }
    );
  };

  const onAttachmentClick = () => {
    if (!isOnline) return;
    setShowAttachMenu((v) => !v);
  };

  const handleImageSelected = async (e) => {
    if (!isOnline) return;
    const file = e.target.files?.[0];
    if (!file || !currentChatUser?.id || !userInfo?.id) return;
    const form = new FormData();
    form.append("image", file, file.name || 'image');
    form.append("from", String(userInfo.id));
    form.append("to", String(currentChatUser.id));
    const toastId = showToast.loading("Invoking image...");
    uploadImageMutation.mutate(form, {
      onSuccess: (data) => {
        showToast.dismiss(toastId);
        showToast.success("Image echo sent!");
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
        setShowAttachMenu(false);
      },
      onError: (err) => {
        showToast.dismiss(toastId);
        showToast.error("Invocation failed. Try again.");
        console.error("sendImage error", err);
      },
    });
  };

  const handleVideoSelected = async (e) => {
    if (!isOnline) return;
    const file = e.target.files?.[0];
    if (!file || !currentChatUser?.id || !userInfo?.id) return;
    const form = new FormData();
    form.append("video", file, file.name || 'video');
    form.append("from", String(userInfo.id));
    form.append("to", String(currentChatUser.id));
    const toastId = showToast.loading("Conjuring video essence...");
    uploadVideoMutation.mutate(form, {
      onSuccess: (data) => {
        showToast.dismiss(toastId);
        showToast.success("Video essence sent!");
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
        setShowAttachMenu(false);
      },
      onError: (err) => {
        showToast.dismiss(toastId);
        showToast.error("Conjuration failed. Try again.");
        console.error("sendVideo error", err);
      },
    });
  };

  const handleGenericFileSelected = async (e) => {
    if (!isOnline) return;
    const file = e.target.files?.[0];
    if (!file || !currentChatUser?.id || !userInfo?.id) return;
    const form = new FormData();
    form.append("file", file, file.name || 'file');
    form.append("from", String(userInfo.id));
    form.append("to", String(currentChatUser.id));
    const toastId = showToast.loading("Transcribing ancient file...");
    uploadFileMutation.mutate(form, {
      onSuccess: (data) => {
        showToast.dismiss(toastId);
        showToast.success("Ancient file inscribed!");
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
        setShowAttachMenu(false);
      },
      onError: (err) => {
        showToast.dismiss(toastId);
        showToast.error("Transcription failed. Try again.");
        console.error("sendFile error", err);
      },
    });
  };

  const handleSendLocation = () => {
    if (!isOnline || !currentChatUser?.id || !userInfo?.id) return;
    if (!navigator.geolocation) {
      showToast.error("Ancient geomancy not supported by your device.");
      return;
    }
    const toastId = showToast.loading("Divining ley-line coordinates...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords || {};
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
          showToast.dismiss(toastId);
          showToast.error("Failed to divine location.");
          return;
        }
        sendLocationMutation.mutate(
          { from: userInfo.id, to: currentChatUser.id, latitude, longitude },
          {
            onSuccess: (data) => {
              showToast.dismiss(toastId);
              showToast.success("Ley-line coordinates sent!");
              setMessages([...(messages || []), data]);
            },
            onError: () => {
              showToast.dismiss(toastId);
              showToast.error("Failed to send ley-line coordinates.");
            },
          }
        );
      },
      () => {
        showToast.dismiss(toastId);
        showToast.error("Permission to access ley-lines denied.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div
      className="bg-ancient-bg-medium h-20 px-4 flex items-center gap-3 relative"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {/* Camera/Attachment Icon (Left) - Opens attachment menu */}
      <div className="flex relative">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-ancient-bg-dark/50 transition-colors duration-200"
          onClick={onAttachmentClick}
          title="Attach Relic"
        >
          <FaCamera className="text-ancient-icon-inactive text-xl" />
        </button>

        {showAttachMenu && (
          <AttachmentDropdown
            onImage={() => {
              imageInputRef.current?.click();
              setShowAttachMenu(false);
            }}
            onVideo={() => {
              videoInputRef.current?.click();
              setShowAttachMenu(false);
            }}
            onFile={() => {
              genericFileInputRef.current?.click();
              setShowAttachMenu(false);
            }}
            onLocation={() => {
              handleSendLocation();
              setShowAttachMenu(false);
            }}
            onEmoji={() => {
              setShowEmojiPicker(true);
              setShowAttachMenu(false);
            }}
          />
        )}

        {/* Hidden file inputs */}
        <input type="file" accept="image/*" className="hidden" ref={imageInputRef} onChange={handleImageSelected} />
        <input type="file" accept="video/*" className="hidden" ref={videoInputRef} onChange={handleVideoSelected} />
        <input type="file" className="hidden" ref={genericFileInputRef} onChange={handleGenericFileSelected} />
      </div>

      {/* Emoji toggle button */}
      <button
        id="emoji-open"
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-ancient-bg-dark/50 transition-colors duration-200"
        onClick={handleEmojiModal}
        title="Invoke Glyph"
      >
        <BsEmojiSmile className="text-ancient-icon-inactive text-xl" />
      </button>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-24 left-4 z-50" ref={emojiPickerRef}>
          <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
        </div>
      )}

      <ReplyPreview replyTo={replyTo} currentChatUser={currentChatUser} userInfo={userInfo} onCancel={clearReplyTo} />

      {/* Message Input (Center - Full width) */}
      <div className="flex-1 h-12 flex items-center bg-ancient-input-bg border border-ancient-input-border rounded-full px-5 shadow-inner focus-within:border-ancient-icon-glow transition-all duration-300">
        <input
          type="text"
          placeholder="Invoke message..."
          className="bg-transparent text-sm focus:outline-none text-ancient-text-light placeholder:text-ancient-text-muted h-full w-full"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onPaste={onPaste}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && message.trim().length > 0) {
              sendMessage();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && replyTo) {
              clearReplyTo();
            }
          }}
          ref={inputRef}
        />
      </div>

      {/* Microphone/Send Icon (Right) */}
      <div className="flex items-center justify-center">
        {message.trim().length > 0 ? (
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-ancient-bg-dark/50 transition-colors duration-200"
            onClick={sendMessage}
            title="Send Invocation"
            disabled={!isOnline || sendMessageMutation.isPending}
            style={{ opacity: (!isOnline || sendMessageMutation.isPending) ? 0.6 : 1 }}
          >
            <MdSend className="text-ancient-icon-glow text-2xl" />
          </button>
        ) : (
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-ancient-bg-dark/50 transition-colors duration-200"
            onClick={() => setShowAudioRecords(true)}
            title="Record Whisper"
            disabled={!isOnline}
            style={{ opacity: !isOnline ? 0.6 : 1 }}
          >
            <FaMicrophone className="text-ancient-icon-glow text-xl" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {sendMessageMutation.isError && (
        <div className="absolute -top-12 right-4 z-20">
          <ErrorMessage message="Failed to send. Re-invoke." />
        </div>
      )}

      {/* Audio Recorder */}
      {showAudioRecords && <CaptureAudio onChange={setShowAudioRecords} />}

      {/* Upload Progress Bar */}
      {uploadingLabel && (
        <div className="absolute -top-12 left-0 right-0 flex items-center justify-center gap-3 px-6 py-2 bg-ancient-bg-medium/95 backdrop-blur-sm rounded-lg shadow-lg mx-4">
          <span className="text-ancient-text-light text-xs italic whitespace-nowrap">{uploadingLabel}</span>
          <div className="flex-1 h-1.5 bg-ancient-border-stone rounded-full overflow-hidden">
            <div 
              className="h-full bg-ancient-icon-glow rounded-full transition-all duration-100" 
              style={{ width: `${uploadProgress}%` }} 
            />
          </div>
          <span className="text-ancient-text-light text-xs font-medium">{uploadProgress}%</span>
        </div>
      )}
    </div>
  );
}

export default MessageBar;
