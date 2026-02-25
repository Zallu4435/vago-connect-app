import { useEffect } from 'react';
import { useSocketStore } from '@/stores/socketStore';
import { useChatStore } from '@/stores/chatStore';
import { useQueryClient } from '@tanstack/react-query';
import { createSocketQuerySync } from '@/lib/socketQuerySync';
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
    s.off('message-edited', onEdited);
    s.off('message-deleted', onDeleted);
    s.off('message-reacted', onReacted);
    s.off('message-starred', onStarred);
    s.off('message-forwarded', onForwarded);
    s.on('message-status-update', onStatusUpdate);
    s.on('message-edited', onEdited);
    s.on('message-deleted', onDeleted);
    s.on('message-reacted', onReacted);
    s.on('message-starred', onStarred);
    s.on('message-forwarded', onForwarded);
    attachedRef.current = true;

    // ── message-sent: full DB-persisted message (call records, own sent messages) ──
    const onMessageSent = (data: any) => {
      const message: Message = data?.message || data;
      if (!message?.id) return;

      // Determine which conversation this belongs to — use conversationId on the message
      const convId = (message as any)?.conversationId;
      if (!convId) return;

      // Upsert into any matching messages cache
      qc.setQueriesData({ queryKey: ['messages'] }, (old: any) => {
        if (!old) return old;
        const upsert = (list: any[]) => {
          const exists = list.some((m: any) => m.id === message.id);
          if (exists) {
            // Update existing (e.g. call record status changed from 'initiated' → 'ended')
            return list.map((m: any) => m.id === message.id ? { ...m, ...message } : m);
          }
          return [...list, message];
        };
        if (Array.isArray(old)) return upsert(old);
        if (Array.isArray(old?.pages)) {
          return { ...old, pages: old.pages.map((p: any) => ({ ...p, messages: upsert(p.messages || []) })) };
        }
        return old;
      });

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
      s.off('message-edited', onEdited);
      s.off('message-deleted', onDeleted);
      s.off('message-reacted', onReacted);
      s.off('message-starred', onStarred);
      s.off('message-forwarded', onForwarded);
      attachedRef.current = false;
    };
  }, [socket, currentChatUser?.id, addMessage, socketSync, authUserId]);
}
