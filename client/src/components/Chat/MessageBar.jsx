import React, { useState, useRef, useEffect, useCallback } from "react";
import { BsEmojiSmile } from "react-icons/bs";
import { MdSend, MdAttachFile } from "react-icons/md";
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
import { useEditMessage } from "@/hooks/mutations/useEditMessage";
import ErrorMessage from "@/components/common/ErrorMessage";
import { showToast } from "@/lib/toast";
import { useSendLocation } from "@/hooks/mutations/useSendLocation";
import { api } from "@/lib/api";
import { ADD_IMAGE_ROUTE, ADD_VIDEO_ROUTE, ADD_FILE_ROUTE } from "@/utils/ApiRoutes";
import ActionSheet from "@/components/common/ActionSheet";
import MediaPreviewModal from "./MediaPreviewModal";
import { useClickOutside } from "@/hooks/useClickOutside";

const CaptureAudio = dynamic(() => import("../common/CaptureAudio"), { ssr: false });
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false, loading: () => null });

// Normalize message helper
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
  replyToMessageId: raw?.replyToMessageId,
  quotedMessage: raw?.quotedMessage,
});

function MessageBar({ isOnline = true }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const messages = useChatStore((s) => s.messages);
  const setMessages = useChatStore((s) => s.setMessages);
  const replyTo = useChatStore((s) => s.replyTo);
  const clearReplyTo = useChatStore((s) => s.clearReplyTo);
  const editMessage = useChatStore((s) => s.editMessage);
  const clearEditMessage = useChatStore((s) => s.clearEditMessage);
  const socket = useSocketStore((s) => s.socket);
  const qc = useQueryClient();

  // Simplified state
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [previewContext, setPreviewContext] = useState(null); // 'image' | 'video' | 'file'
  const [uploadProgress, setUploadProgress] = useState({ label: "", percent: 0 });
  const [previewFiles, setPreviewFiles] = useState([]);

  // Refs
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const attachButtonRef = useRef(null);

  // Mutations
  const sendMessageMutation = useSendMessage();
  const sendLocationMutation = useSendLocation();
  const editMessageMutation = useEditMessage();

  // Add message to cache
  const addToMessagesCache = useCallback((msg) => {
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
  }, [qc]);

  // Upload file with progress
  const uploadFile = useCallback(async (file, caption = "") => {
    if (!file || !currentChatUser?.id || !userInfo?.id) return;

    // 50 MB limit validation
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      showToast.error(`File "${file.name}" exceeds the 50MB limit.`);
      return;
    }

    const mime = file.type || "";
    const isImage = mime.startsWith("image/");
    const isVideo = mime.startsWith("video/");
    const endpoint = isImage ? ADD_IMAGE_ROUTE : isVideo ? ADD_VIDEO_ROUTE : ADD_FILE_ROUTE;
    const field = isImage ? "image" : isVideo ? "video" : "file";
    const tempId = Date.now();

    const form = new FormData();
    form.append(field, file, file.name || 'upload');
    form.append("from", String(userInfo.id));
    form.append("to", String(currentChatUser.id));
    if (caption?.trim()) form.append("caption", caption.trim());
    if (replyTo?.id) form.append("replyToMessageId", String(replyTo.id));
    const isGroup = currentChatUser?.isGroup || currentChatUser?.type === 'group';
    if (isGroup) form.append("isGroup", "true");

    // Optimistic message
    const optimisticMsg = normalizeMessage({
      id: tempId,
      status: "pending",
      createdAt: new Date().toISOString(),
      content: "",
    }, userInfo.id, currentChatUser.id, isImage ? "image" : isVideo ? "video" : "document");
    if (caption?.trim()) optimisticMsg.caption = caption.trim();

    setMessages((prev) => ([...(prev || []), optimisticMsg]));

    try {
      setUploadProgress({
        label: isImage ? "Uploading image..." : isVideo ? "Uploading video..." : "Uploading file...",
        percent: 0
      });

      const { data } = await api.post(endpoint, form, {
        timeout: 60000, // Explicitly override the default 10s Axios timeout for large media files
        onUploadProgress: (e) => {
          if (e.total) {
            setUploadProgress((prev) => ({ ...prev, percent: Math.round((e.loaded * 100) / e.total) }));
          }
        },
      });

      socket.current?.emit("send-msg", {
        to: currentChatUser.id,
        from: userInfo.id,
        message: data.content,
        type: data.type || (isImage ? "image" : isVideo ? "video" : "document"),
        messageId: data.id,
        replyToMessageId: data.replyToMessageId,
        quotedMessage: data.quotedMessage,
        caption: data.caption,
      });

      const msg = normalizeMessage(data, userInfo.id, currentChatUser.id, isImage ? "image" : isVideo ? "video" : "document");
      if (!msg.caption && caption?.trim()) msg.caption = caption.trim();

      // Remove optimistic and add real
      setMessages((prev) => prev.map(m => m.id === tempId ? msg : m));
      addToMessagesCache(msg);
    } catch (err) {
      useChatStore.getState().updateMessageStatus(tempId, "error");
      showToast.error("Upload failed. Try again.");
      console.error("uploadFile error", err);
    } finally {
      setTimeout(() => setUploadProgress({ label: "", percent: 0 }), 400);
    }
  }, [currentChatUser, userInfo, socket, setMessages, addToMessagesCache]);

  // Handle paste
  const onPaste = useCallback((e) => {
    if (!isOnline) return;
    const files = e.clipboardData?.files;
    if (files?.length > 0) {
      e.preventDefault();
      const f = files[0];
      const mime = f?.type || "";
      if (mime.startsWith("image/")) {
        setPreviewContext('image');
      } else if (mime.startsWith("video/")) {
        setPreviewContext('video');
      } else {
        setPreviewContext('file');
      }
      setPreviewFiles([f]);
    }
  }, [isOnline]);

  // Handle drag & drop
  const onDrop = useCallback((e) => {
    if (!isOnline) return;
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files?.length > 0) {
      const f = files[0];
      const mime = f?.type || "";
      if (mime.startsWith("image/")) {
        setPreviewContext('image');
      } else if (mime.startsWith("video/")) {
        setPreviewContext('video');
      } else {
        setPreviewContext('file');
      }
      setPreviewFiles([f]);
    }
  }, [isOnline]);

  const onDragOver = useCallback((e) => { e.preventDefault(); }, []);

  useClickOutside(showEmojiPicker, () => setShowEmojiPicker(false), [emojiPickerRef]);

  // Focus input when reply is set
  useEffect(() => {
    if ((replyTo || editMessage) && inputRef.current) {
      if (editMessage) setMessage(editMessage.content || "");
      try { inputRef.current.focus(); } catch { }
    }
  }, [replyTo, editMessage]);

  const handleEmojiClick = (_e, emojiObject) => {
    const emoji = emojiObject?.emoji || _e?.emoji;
    if (emoji) setMessage((prev) => prev + emoji);
  };

  const sendMessage = useCallback(() => {
    if (!isOnline) return;
    const text = message.trim();
    if (!text || !currentChatUser?.id || !userInfo?.id) return;

    if (editMessage) {
      // Optimistically update locally
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editMessage.id
            ? { ...m, content: text, isEdited: true, editedAt: new Date().toISOString() }
            : m
        )
      );

      editMessageMutation.mutate(
        { id: editMessage.id, content: text },
        {
          onError: (e) => {
            console.error("editMessage error", e);
            showToast.error("Failed to edit message. Try again.");
          }
        }
      );

      clearEditMessage();
      setMessage("");
      return;
    }

    const tempId = Date.now();
    const optimisticMsg = normalizeMessage({
      id: tempId,
      content: text,
      status: "pending",
      createdAt: new Date().toISOString(),
    }, userInfo.id, currentChatUser.id, "text");

    setMessages((prev) => ([...(prev || []), optimisticMsg]));
    setMessage("");
    if (replyTo) clearReplyTo();

    sendMessageMutation.mutate(
      {
        from: userInfo.id,
        to: currentChatUser.id,
        content: text,
        type: "text",
        replyToMessageId: replyTo?.id,
        isGroup: currentChatUser?.isGroup || currentChatUser?.type === 'group'
      },
      {
        onSuccess: (data) => {
          socket.current?.emit("send-msg", {
            to: currentChatUser.id,
            from: userInfo.id,
            message: data.content,
            type: data.type || "text",
            messageId: data.id,
            replyToMessageId: data.replyToMessageId,
            quotedMessage: data.quotedMessage,
          });
          const msg = normalizeMessage(data, userInfo.id, currentChatUser.id, "text");
          setMessages((prev) => prev.map(m => m.id === tempId ? msg : m));
          addToMessagesCache(msg);
        },
        onError: (e) => {
          useChatStore.getState().updateMessageStatus(tempId, "error");
          console.error("sendMessage error", e);
          showToast.error("Failed to send message. Try again.");
        },
      }
    );
  }, [isOnline, message, currentChatUser, userInfo, replyTo, editMessage, sendMessageMutation, editMessageMutation, socket, setMessages, addToMessagesCache, clearReplyTo, clearEditMessage]);

  const handleFileSelect = useCallback((type) => {
    if (!isOnline) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : '*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const mime = file.type || "";

      // Strict enforcement to prevent OS dialog bypass
      if (type === 'image' && !mime.startsWith("image/")) {
        showToast.error("Please select a valid image file.");
        return;
      }
      if (type === 'video' && !mime.startsWith("video/")) {
        showToast.error("Please select a valid video file.");
        return;
      }
      if (type === 'file' && (mime.startsWith("image/") || mime.startsWith("video/"))) {
        showToast.error("Please use the Image or Video options for media.");
        return;
      }

      setPreviewContext(type); // Pass the strict context to the modal

      if (type === 'image' || type === 'video' || type === 'file') {
        // We now route even 'file' types to the preview modal to allow captions
        setPreviewFiles([file]);
      } else {
        uploadFile(file);
      }
    };
    input.click();
    setShowAttachMenu(false);
  }, [isOnline, uploadFile]);

  const handleSendLocation = useCallback(() => {
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
          {
            from: userInfo.id,
            to: currentChatUser.id,
            latitude,
            longitude,
            replyToMessageId: replyTo?.id,
            isGroup: currentChatUser?.isGroup || currentChatUser?.type === 'group'
          },
          {
            onSuccess: (data) => {
              showToast.dismiss(toastId);
              showToast.success("Location sent.");
              socket.current?.emit("send-msg", {
                to: currentChatUser.id,
                from: userInfo.id,
                message: data.content,
                type: data.type || "location",
                messageId: data.id,
                replyToMessageId: data.replyToMessageId,
                quotedMessage: data.quotedMessage,
              });
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
    setShowAttachMenu(false);
  }, [isOnline, currentChatUser, userInfo, sendLocationMutation, setMessages, addToMessagesCache]);

  return (
    <>
      {/* Reply Preview - positioned above the bar */}
      {replyTo && !editMessage && (
        <div className="bg-ancient-bg-medium border-t border-ancient-border-stone/50 px-3 sm:px-4 py-2">
          <div className="flex items-start justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-ancient-input-bg border border-ancient-input-border rounded-lg">
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-ancient-text-muted font-semibold truncate">
                Replying to {String(replyTo.senderId) === String(userInfo?.id) ? "You" : currentChatUser?.name || "Contact"}
              </div>
              <div className="text-sm sm:text-base text-ancient-text-light truncate">
                {replyTo.type === "text" ? replyTo.content || "" : `[${replyTo.type}]`}
              </div>
            </div>
            <button
              onClick={clearReplyTo}
              className="shrink-0 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-md bg-ancient-bg-medium border border-ancient-input-border text-ancient-text-muted hover:text-ancient-text-light hover:border-ancient-icon-glow transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Preview - positioned above the bar */}
      {editMessage && (
        <div className="bg-ancient-bg-medium border-t border-ancient-border-stone/50 px-3 sm:px-4 py-2">
          <div className="flex items-start justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-ancient-input-bg border border-ancient-input-border border-l-4 border-l-ancient-icon-glow rounded-lg">
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-ancient-icon-glow font-semibold truncate">
                Editing message
              </div>
              <div className="text-sm sm:text-base text-ancient-text-light truncate">
                {editMessage.content}
              </div>
            </div>
            <button
              onClick={() => {
                clearEditMessage();
                setMessage("");
              }}
              className="shrink-0 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-md bg-ancient-bg-medium border border-ancient-input-border text-ancient-text-muted hover:text-ancient-text-light hover:border-ancient-icon-glow transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div
        className="bg-ancient-bg-medium h-18 sm:h-20 px-3 sm:px-4 flex items-center gap-2 sm:gap-3 relative border-t border-ancient-border-stone/50"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        {/* Main Controls or Audio Recorder */}
        {!showAudioRecorder ? (
          <>
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* Emoji Button */}
              <button
                className="p-2 sm:p-2.5 rounded-full hover:bg-ancient-bg-dark/60 transition-all active:scale-95 text-ancient-icon-inactive hover:text-white"
                onClick={() => { setShowEmojiPicker(v => !v); setShowAttachMenu(false); }}
                title="Emoji"
              >
                <BsEmojiSmile className="text-xl sm:text-2xl" />
              </button>

              {/* Attach Button */}
              <div className="relative">
                <button
                  ref={attachButtonRef}
                  className="p-2 sm:p-2.5 rounded-full hover:bg-ancient-bg-dark/60 transition-all active:scale-95 text-ancient-icon-inactive hover:text-white"
                  onClick={() => { setShowAttachMenu((v) => !v); setShowEmojiPicker(false); }}
                  title="Attach"
                  disabled={!isOnline}
                >
                  <MdAttachFile className="text-xl sm:text-2xl transform rotate-45" />
                </button>

                <ActionSheet
                  open={showAttachMenu}
                  onClose={() => setShowAttachMenu(false)}
                  align="left"
                  placement="top"
                  anchorRef={attachButtonRef}
                  items={[
                    { label: "Image", icon: FaCamera, onClick: () => handleFileSelect('image') },
                    { label: "Video", icon: IoVideocam, onClick: () => handleFileSelect('video') },
                    { label: "File", icon: MdInsertDriveFile, onClick: () => handleFileSelect('file') },
                    { label: "Location", icon: FaLocationArrow, onClick: handleSendLocation },
                  ]}
                />
              </div>
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-20 sm:bottom-24 left-4 z-50" ref={emojiPickerRef}>
                <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
              </div>
            )}

            {/* Message Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Type a message..."
                className="w-full h-11 sm:h-12 bg-ancient-input-bg border border-ancient-input-border rounded-full px-4 sm:px-5 text-sm sm:text-base text-ancient-text-light placeholder:text-ancient-text-muted focus:outline-none focus:border-ancient-icon-glow transition-all shadow-inner"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onPaste={onPaste}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && message.trim().length > 0) {
                    sendMessage();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    if (replyTo) clearReplyTo();
                    if (editMessage) {
                      clearEditMessage();
                      setMessage("");
                    }
                  }
                }}
                ref={inputRef}
                disabled={!isOnline}
              />

              {/* Upload Progress Overlay */}
              {uploadProgress.label && (
                <div className="absolute inset-0 bg-ancient-input-bg/95 backdrop-blur-sm rounded-full flex items-center px-4 gap-3 border border-ancient-icon-glow/50">
                  <span className="text-ancient-text-light text-xs sm:text-sm flex-shrink-0">{uploadProgress.label}</span>
                  <div className="flex-1 h-1.5 bg-ancient-border-stone rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ancient-icon-glow rounded-full transition-all duration-100"
                      style={{ width: `${uploadProgress.percent}%` }}
                    />
                  </div>
                  <span className="text-ancient-text-light text-xs sm:text-sm font-medium flex-shrink-0">{uploadProgress.percent}%</span>
                </div>
              )}
            </div>

            {/* Send/Microphone Button */}
            <button
              className="p-2 sm:p-2.5 rounded-full hover:bg-ancient-bg-dark/60 transition-all active:scale-95 flex-shrink-0 disabled:opacity-70"
              onClick={message.trim().length > 0 ? sendMessage : () => setShowAudioRecorder(true)}
              title={message.trim().length > 0 ? "Send Message" : "Record Voice"}
              disabled={!isOnline || (message.trim().length > 0 && sendMessageMutation.isPending)}
            >
              {message.trim().length > 0 ? (
                sendMessageMutation.isPending ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-ancient-icon-glow border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MdSend className="text-ancient-icon-glow text-xl sm:text-2xl" />
                )
              ) : (
                <FaMicrophone className="text-ancient-icon-glow text-lg sm:text-xl" />
              )}
            </button>
          </>
        ) : (
          <CaptureAudio onChange={setShowAudioRecorder} />
        )}

        {/* Error Message */}
        {sendMessageMutation.isError && (
          <div className="absolute -top-12 right-4 z-20">
            <ErrorMessage message="Failed to send. Try again." />
          </div>
        )}

        {/* Media Preview Modal */}
        <MediaPreviewModal
          open={previewFiles.length > 0}
          files={previewFiles}
          context={previewContext}
          onClose={() => {
            setPreviewFiles([]);
            setPreviewContext(null);
          }}
          onSend={(payload) => {
            if (payload?.__update__ && Array.isArray(payload.files)) {
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

            // Immediately clear UI
            setPreviewFiles([]);
            setPreviewContext(null);

            // Process uploads asynchronously in the background so UI doesn't freeze
            files.forEach((f, i) => {
              const cap = captions[i];
              // Fire-and-forget; uploadFile handles its own optimistics and toasts
              uploadFile(f, cap).catch(() => { });
            });
          }}
        />
      </div>
    </>
  );
}

export default MessageBar;
