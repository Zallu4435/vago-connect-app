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
import { useEditMessage } from '@/hooks/messages/useEditMessage';
import { useSendMedia } from '@/hooks/messages/useSendMedia';
import { normalizeMessage } from "@/utils/messageHelpers";
import ErrorMessage from "@/components/common/ErrorMessage";
import { showToast } from "@/lib/toast";
import ActionSheet from "@/components/common/ActionSheet";
import MediaPreviewModal from "./MediaPreviewModal";
import { useClickOutside } from '@/hooks/ui/useClickOutside';
import { upsertMessageInCache } from '@/lib/cacheHelpers';
import { useContacts } from '@/hooks/contacts/useContacts';

const CaptureAudio = dynamic(() => import("../common/CaptureAudio"), { ssr: false });
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false, loading: () => null });


function MessageBar({ isOnline = true }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const { data: contacts = [] } = useContacts(userInfo?.id);
  const contactEntry = contacts.find((c) => String(c?.id) === String(currentChatUser?.id));
  const isBlocked = Boolean(contactEntry?.isBlocked);
  const blockedBy = Boolean(contactEntry?.blockedBy);
  const isChatBlocked = isBlocked || blockedBy;

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
  const { uploadFile, uploadProgress } = useSendMedia();
  const [previewFiles, setPreviewFiles] = useState([]);

  // Refs
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const attachButtonRef = useRef(null);

  // Mutations
  const editMessageMutation = useEditMessage();

  // Typing state
  const typingTimeoutRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  // Add message to cache
  const addToMessagesCache = useCallback((msg) => {
    upsertMessageInCache(qc, msg);
  }, [qc]);

  // Upload logic abstracted to useSendMedia

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
    if (isChatBlocked) {
      showToast.error("Cannot message a blocked contact");
      return;
    }
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
    console.log("[MessageBar] Sending message. Reply to:", replyTo?.id);

    const optimisticMsg = normalizeMessage({
      id: tempId,
      conversationId: currentChatUser?.conversationId || (currentChatUser?.isGroup ? currentChatUser.id : 0),
      content: text,
      status: "pending",
      createdAt: new Date().toISOString(),
      replyToMessageId: replyTo?.id,
      quotedMessage: replyTo ? {
        id: replyTo.id,
        content: replyTo.content || replyTo.message,
        senderId: replyTo.senderId,
        type: replyTo.type
      } : undefined
    }, userInfo.id, currentChatUser.id, "text");

    console.log("[MessageBar] Optimistic message created:", optimisticMsg);

    setMessages((prev) => ([...(prev || []), optimisticMsg]));
    setMessage("");
    if (replyTo) clearReplyTo();

    // Clear typing indicator instantly
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTyping && socket.current) {
      socket.current.emit("stop-typing", {
        to: currentChatUser.id,
        from: userInfo.id
      });
      setIsTyping(false);
    }

    // Pure WebSocket sending logic
    socket.current?.emit("send-text-message", {
      to: currentChatUser.id,
      from: userInfo.id,
      message: text,
      type: "text",
      replyToMessageId: replyTo?.id,
      isGroup: currentChatUser?.isGroup || currentChatUser?.type === 'group',
      tempId,
    });

    // We optimistically added to cache, the message-sent listener will swap the tempId
    addToMessagesCache(optimisticMsg);

  }, [isOnline, isChatBlocked, message, currentChatUser, userInfo, replyTo, editMessage, editMessageMutation, setMessages, addToMessagesCache, clearReplyTo, clearEditMessage, isTyping, socket]);

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
        const lat = latitude;
        const lng = longitude;
        showToast.dismiss(toastId);

        const tempId = Date.now();
        const payload = { lat, lng };
        const optimisticMsg = normalizeMessage({
          id: tempId,
          conversationId: currentChatUser?.conversationId || (currentChatUser?.isGroup ? currentChatUser.id : 0),
          content: JSON.stringify(payload),
          status: "pending",
          createdAt: new Date().toISOString(),
        }, userInfo.id, currentChatUser.id, "location");

        setMessages((prev) => ([...(prev || []), optimisticMsg]));
        addToMessagesCache(optimisticMsg);

        if (replyTo) clearReplyTo();

        // Pure WebSocket sending logic
        socket.current?.emit("send-location-message", {
          to: currentChatUser.id,
          from: userInfo.id,
          latitude: lat,
          longitude: lng,
          replyToMessageId: replyTo?.id,
          isGroup: currentChatUser?.isGroup || currentChatUser?.type === 'group',
          tempId,
        });

      },
      () => {
        showToast.dismiss(toastId);
        showToast.error("Location permission denied.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
    setShowAttachMenu(false);
  }, [isOnline, currentChatUser, userInfo, setMessages, addToMessagesCache, socket, replyTo, clearReplyTo]);

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
        onDrop={isChatBlocked ? undefined : onDrop}
        onDragOver={isChatBlocked ? undefined : onDragOver}
      >
        {isChatBlocked ? (
          <div className="flex-1 flex justify-center items-center text-ancient-text-muted text-sm sm:text-base font-medium">
            {isBlocked
              ? "You blocked this contact."
              : "You cannot send messages to this contact."}
          </div>
        ) : !showAudioRecorder ? (
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
                  type="button"
                  disabled={isChatBlocked}
                  onClick={() => { setShowAttachMenu((v) => !v); setShowEmojiPicker(false); }}
                  className={`
                    p-2 sm:p-2.5 rounded-full hover:bg-ancient-bg-dark/60 transition-all active:scale-95
                    ${isChatBlocked ? "opacity-30 cursor-not-allowed text-ancient-icon-inactive" : "text-ancient-icon-inactive hover:text-white"}
                  `}
                  title="Attach"
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
                placeholder={isChatBlocked ? "Cannot send messages to a blocked contact" : "Type a message..."}
                className={`
                  w-full h-11 sm:h-12 bg-ancient-input-bg border border-ancient-input-border rounded-full px-4 sm:px-5
                  text-sm sm:text-base text-ancient-text-light placeholder:text-ancient-text-muted
                  focus:outline-none focus:border-ancient-icon-glow transition-all shadow-inner
                  ${isChatBlocked ? "opacity-50 cursor-not-allowed" : ""}
                `}
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
              disabled={!isOnline}
            >
              {message.trim().length > 0 ? (
                <MdSend className="text-ancient-icon-glow text-xl sm:text-2xl" />
              ) : (
                <FaMicrophone className="text-ancient-icon-glow text-lg sm:text-xl" />
              )}
            </button>
          </>
        ) : (
          <CaptureAudio onChange={setShowAudioRecorder} />
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
