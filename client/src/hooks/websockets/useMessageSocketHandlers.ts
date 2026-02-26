import { useEffect } from 'react';
import { useSocketStore } from '@/stores/socketStore';
import { useChatStore } from '@/stores/chatStore';
import { useQueryClient } from '@tanstack/react-query';
import { createSocketQuerySync } from '@/lib/socketQuerySync';
import { updateMessagesCache, upsertMessageInCache, updateContactProfileInCache, updateGroupProfileInCache } from '@/lib/cacheHelpers';
import type { Message } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useRef } from 'react';

export function useMessageSocketHandlers() {
  const socket = useSocketStore((s) => s.socket);
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const addMessage = useChatStore((s) => s.addMessage);
  const authUserId = useAuthStore((s) => s.userInfo?.id);

  const qc = useQueryClient();
  const socketSync = createSocketQuerySync(qc);
  const attachedRef = useRef(false);

  useEffect(() => {
    const s = socket.current;
    if (!s || attachedRef.current) return;
    const onMsgReceive = (data: any) => {
      const t = (data?.type || 'text').toLowerCase();
      // Allowed real message types — do NOT map 'call' to 'text'
      const knownTypes = ['text', 'audio', 'image', 'video', 'voice', 'document', 'location', 'call'];
      const mappedType: Message['type'] = knownTypes.includes(t) ? (t as Message['type']) : 'text';
      const normalized: Message = {
        id: Number(data?.messageId),
        senderId: Number(data?.from),
        receiverId: Number(data?.to ?? 0),
        type: mappedType,
        message: String(data?.message ?? ''),
        content: String(data?.message ?? ''),
        messageStatus: 'delivered',
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        isForwarded: Boolean(data?.isForwarded),
        replyToMessageId: data?.replyToMessageId,
        quotedMessage: data?.quotedMessage,
        caption: data?.caption,
      };
      socketSync.onMessageReceive(normalized, String(normalized.receiverId), currentChatUser?.id);
      addMessage(normalized);
    };
    // Ensure no duplicate handlers before attaching
    s.off('msg-recieve', onMsgReceive);
    s.on('msg-recieve', onMsgReceive);
    const onStatusUpdate = ({ messageId, status }: any) => {
      socketSync.onMessageStatusUpdate(messageId, status);
    };
    const onMessagesRead = ({ messageIds }: any) => {
      if (Array.isArray(messageIds)) {
        socketSync.onMessagesRead(messageIds);
      }
    };
    const onEdited = ({ messageId, newContent, editedAt }: any) => {
      socketSync.onMessageEdited(messageId, newContent, editedAt);
    };
    const onDeleted = (data: any) => {
      const mid = data?.messageId || data?.id;
      const { deleteType, deletedBy } = data;
      socketSync.onMessageDeleted(mid, deleteType, { deletedBy });
    };
    const onReacted = ({ messageId, reactions }: any) => {
      socketSync.onMessageReacted(messageId, reactions || []);
    };
    const onStarred = ({ messageId, starred }: any) => {
      socketSync.onMessageStarred(messageId, starred, String(authUserId || ''));
    };
    const onForwarded = (payload: any) => {
      socketSync.onMessageForwarded(payload);
    };
    s.off('message-status-update', onStatusUpdate);
    s.off('messages-read', onMessagesRead);
    s.off('message-edited', onEdited);
    s.off('message-deleted', onDeleted);
    s.off('message-reacted', onReacted);
    s.off('message-starred', onStarred);
    s.off('message-forwarded', onForwarded);
    s.on('message-status-update', onStatusUpdate);
    s.on('messages-read', onMessagesRead);
    s.on('message-edited', onEdited);
    s.on('message-deleted', onDeleted);
    s.on('message-reacted', onReacted);
    s.on('message-starred', onStarred);
    s.on('message-forwarded', onForwarded);

    const onGroupUpdated = ({ conversation }: any) => {
      if (!conversation?.id) return;
      const current = useChatStore.getState().currentChatUser;
      if (current && (current.id === conversation.id || (current as any).conversationId === conversation.id)) {
        useChatStore.getState().setCurrentChatUser({
          ...current,
          name: conversation.groupName,
          description: conversation.groupDescription,
          profilePicture: conversation.groupIcon,
          image: conversation.groupIcon,
          groupName: conversation.groupName,
          groupDescription: conversation.groupDescription,
          groupIcon: conversation.groupIcon,
        } as any);
      }
      updateGroupProfileInCache(qc, conversation.id, conversation);
    };
    s.off('group-updated', onGroupUpdated);
    s.on('group-updated', onGroupUpdated);

    const onProfileUpdated = ({ user }: any) => {
      if (!user?.id) return;

      // 1. If we are currently chatting with this user, update active chat header
      const current = useChatStore.getState().currentChatUser;
      if (current && current.id === user.id && !(current as any).conversationId) { // Not a group
        useChatStore.getState().setCurrentChatUser({
          ...current,
          name: user.name,
          about: user.about,
          profilePicture: user.profileImage || user.image,
          image: user.profileImage || user.image,
        } as any);
      }

      // 2. If it's our OWN profile that someone updated from another session
      const authStore = useAuthStore.getState();
      if (authStore.userInfo?.id === user.id) {
        authStore.setUserInfo({ ...authStore.userInfo, ...user } as any);
      }

      // 3. Force contact list and sidebar to re-render instantly instead of refetching
      updateContactProfileInCache(qc, user.id, user);
    };
    s.off('profile-updated', onProfileUpdated);
    s.on('profile-updated', onProfileUpdated);

    attachedRef.current = true;

    // ── message-sent: full DB-persisted message (call records, own sent messages) ──
    const onMessageSent = (data: any) => {
      const message: Message = data?.message || data;
      if (!message?.id) return;

      // Determine which conversation this belongs to — use conversationId on the message
      const convId = (message as any)?.conversationId;
      if (!convId) return;

      // Upsert into any matching messages cache
      upsertMessageInCache(qc, message);

      // Also update the contacts preview row
      if (authUserId) {
        const contactsKey = ['contacts', String(authUserId)];
        qc.setQueryData<any[]>(contactsKey, (old = []) => {
          if (!Array.isArray(old)) return old;
          return old.map((c: any) => {
            if (String(c?.conversationId) !== String(convId)) return c;
            return {
              ...c,
              type: message.type,
              message: message.content || c.message,
              timestamp: message.createdAt || new Date().toISOString(),
              senderId: message.senderId,
              isSystemMessage: Boolean((message as any).isSystemMessage),
              systemMessageType: (message as any).systemMessageType || null,
            };
          });
        });
      }
    };

    s.off('message-sent', onMessageSent);
    s.on('message-sent', onMessageSent);
    return () => {
      s.off('msg-recieve', onMsgReceive);
      s.off('message-status-update', onStatusUpdate);
      s.off('messages-read', onMessagesRead);
      s.off('message-edited', onEdited);
      s.off('message-deleted', onDeleted);
      s.off('message-reacted', onReacted);
      s.off('message-starred', onStarred);
      s.off('message-forwarded', onForwarded);
      s.off('group-updated', onGroupUpdated);
      s.off('profile-updated', onProfileUpdated);
      attachedRef.current = false;
    };
  }, [socket, currentChatUser?.id, addMessage, socketSync, authUserId, qc]);
}
