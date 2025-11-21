import React, { useState, useRef, useEffect } from "react";
import { BsEmojiSmile } from "react-icons/bs";
import { MdSend } from "react-icons/md";
import { FaMicrophone, FaCamera } from "react-icons/fa";
import { IoVideocam } from "react-icons/io5";
import { MdInsertDriveFile } from "react-icons/md";
import { FaLocationArrow } from "react-icons/fa";
import dynamic from "next/dynamic";
import { useQueryClient } from "@tanstack/react-query";
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
import ActionSheet from "@/components/common/ActionSheet";
import ReplyPreview from "./ReplyPreview";
import MediaPreviewModal from "./MediaPreviewModal";

const CaptureAudio = dynamic(() => import("../common/CaptureAudio"), { ssr: false });
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false, loading: () => null });

const normalizeMessage = (raw, fromId, toId, fallbackType = "text") => ({
  id: Number(raw?.id),
  senderId: Number(fromId),
  receiverId: Number(toId),
  type: raw?.type || fallbackType,
  content: String(raw?.content ?? ""),
  message: String(raw?.content ?? ""),
  messageStatus: (raw?.status || "sent"),
  status: (raw?.status || "sent"),
  createdAt: String(raw?.createdAt || new Date().toISOString()),
  timestamp: String(raw?.createdAt || new Date().toISOString()),
  isEdited: Boolean(raw?.isEdited),
  editedAt: raw?.editedAt || undefined,
  reactions: Array.isArray(raw?.reactions) ? raw.reactions : [],
  starredBy: Array.isArray(raw?.starredBy) ? raw.starredBy : [],
  caption: typeof raw?.caption === 'string' ? raw.caption : undefined,
});

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
  const [previewFiles, setPreviewFiles] = useState([]);
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
  const qc = useQueryClient();

  const addToMessagesCache = (msg) => {
    // Update any messages queries (flat or infinite) so ChatContainer sees the message immediately
    qc.setQueriesData({ queryKey: ["messages"] }, (old) => {
      if (!old) return old;
      if (Array.isArray(old)) return [...old, msg];
      if (Array.isArray(old.pages)) {
        if (old.pages.length === 0) return { ...old, pages: [{ messages: [msg], nextCursor: null }] };
        const pages = old.pages.slice();
        const last = pages[pages.length - 1] || { messages: [] };
        const updatedLast = { ...last, messages: [...(last.messages || []), msg] };
        pages[pages.length - 1] = updatedLast;
        return { ...old, pages };
      }
      return old;
    });
  };

  // Drag & drop and paste handlers with progress
  const uploadWithProgress = async (file, caption) => {
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
    if (caption && caption.trim()) form.append("caption", caption.trim());
    try {
      setUploadingLabel(isImage ? "Uploading image..." : isVideo ? "Uploading video..." : "Uploading file...");
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
      {
        const msg = normalizeMessage(data, userInfo.id, currentChatUser.id, isImage ? "image" : isVideo ? "video" : "document");
        if (!msg.caption && caption && caption.trim()) msg.caption = caption.trim();
        setMessages((prev) => ([...(prev || []), msg]));
        addToMessagesCache(msg);
      }
    } catch (err) {
      showToast.error("Upload failed. Try again.");
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
      const f = files[0];
      const mime = f?.type || "";
      if (mime.startsWith("image/") || mime.startsWith("video/")) {
        setPreviewFiles([f]);
      } else {
        uploadWithProgress(f);
      }
    }
  };

  const onDrop = (e) => {
    if (!isOnline) return;
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const f = files[0];
      const mime = f?.type || "";
      if (mime.startsWith("image/") || mime.startsWith("video/")) {
        setPreviewFile(f);
      } else {
        uploadWithProgress(f);
      }
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
          const msg = normalizeMessage(data, userInfo.id, currentChatUser.id, "text");
          setMessages((prev) => ([...(prev || []), msg]));
          addToMessagesCache(msg);
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
    // open preview instead of immediate upload
    setPreviewFiles([file]);
    if (imageInputRef.current) imageInputRef.current.value = "";
    setShowAttachMenu(false);
  };

  const handleVideoSelected = async (e) => {
    if (!isOnline) return;
    const file = e.target.files?.[0];
    if (!file || !currentChatUser?.id || !userInfo?.id) return;
    // open preview instead of immediate upload
    setPreviewFiles([file]);
    if (videoInputRef.current) videoInputRef.current.value = "";
    setShowAttachMenu(false);
  };

  const handleGenericFileSelected = async (e) => {
    if (!isOnline) return;
    const file = e.target.files?.[0];
    if (!file || !currentChatUser?.id || !userInfo?.id) return;
    const form = new FormData();
    form.append("file", file, file.name || 'file');
    form.append("from", String(userInfo.id));
    form.append("to", String(currentChatUser.id));
    const toastId = showToast.loading("Uploading file...");
    uploadFileMutation.mutate(form, {
      onSuccess: (data) => {
        showToast.dismiss(toastId);
        showToast.success("File sent.");
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
        showToast.error("Upload failed. Try again.");
        console.error("sendFile error", err);
      },
    });
  };

  const handleSendLocation = () => {
    if (!isOnline || !currentChatUser?.id || !userInfo?.id) return;
    if (!navigator.geolocation) {
      showToast.error("Location is not supported on this device.");
      return;
    }
    const toastId = showToast.loading("Getting location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords || {};
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
          showToast.dismiss(toastId);
          showToast.error("Failed to get location.");
          return;
        }
        sendLocationMutation.mutate(
          { from: userInfo.id, to: currentChatUser.id, latitude, longitude },
          {
            onSuccess: (data) => {
              showToast.dismiss(toastId);
              showToast.success("Location sent.");
              const msg = normalizeMessage(data, userInfo.id, currentChatUser.id, "location");
              setMessages((prev) => ([...(prev || []), msg]));
              addToMessagesCache(msg);
            },
            onError: () => {
              showToast.dismiss(toastId);
              showToast.error("Failed to send location.");
            },
          }
        );
      },
      () => {
        showToast.dismiss(toastId);
        showToast.error("Location permission denied.");
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
          title="Attach"
        >
          <FaCamera className="text-ancient-icon-inactive text-xl" />
        </button>

        <ActionSheet
          open={showAttachMenu}
          onClose={() => setShowAttachMenu(false)}
          align="left"
          placement="above"
          items={[
            { label: "Image", icon: FaCamera, onClick: () => imageInputRef.current?.click() },
            { label: "Video", icon: IoVideocam, onClick: () => videoInputRef.current?.click() },
            { label: "File", icon: MdInsertDriveFile, onClick: () => genericFileInputRef.current?.click() },
            { label: "Location", icon: FaLocationArrow, onClick: () => handleSendLocation() },
            { label: "Emoji", icon: BsEmojiSmile, onClick: () => setShowEmojiPicker(true) },
          ]}
        />

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
        title="Emoji"
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
          placeholder="Type a message..."
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

      {/* Media Preview Modal */}
      <MediaPreviewModal
        open={previewFiles.length > 0}
        files={previewFiles}
        onClose={() => setPreviewFiles([])}
        onSend={async (payload) => {
          // Handle in-modal updates (adding more files)
          if (payload && payload.__update__ && Array.isArray(payload.files)) {
            setPreviewFiles(payload.files);
            return;
          }
          let files = [];
          let captions = [];
          if (payload && Array.isArray(payload.files)) {
            files = payload.files;
            captions = Array.isArray(payload.captions) ? payload.captions : [];
          } else if (Array.isArray(payload)) {
            files = payload;
          } else if (payload) {
            files = [payload];
          }
          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            // eslint-disable-next-line no-await-in-loop
            await uploadWithProgress(f);
            const cap = captions[i];
            if (cap && cap.trim() && currentChatUser?.id && userInfo?.id) {
              // send caption as a separate text message
              await new Promise((resolve) => {
                sendMessageMutation.mutate(
                  { from: userInfo.id, to: currentChatUser.id, content: cap.trim(), type: "text" },
                  {
                    onSuccess: (data) => {
                      const msg = normalizeMessage(data, userInfo.id, currentChatUser.id, "text");
                      setMessages((prev) => ([...(prev || []), msg]));
                      addToMessagesCache(msg);
                      resolve();
                    },
                    onError: () => resolve(),
                  }
                );
              });
            }
          }
          setPreviewFiles([]);
        }}
      />
    </div>
  );
}

export default MessageBar;
