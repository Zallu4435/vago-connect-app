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
      const mappedType: Message['type'] = ((): Message['type'] => {
        const t = (data?.type || 'text').toLowerCase();
        if (t === 'text' || t === 'audio' || t === 'image') return t as Message['type'];
        return 'text';
      })();
      const normalized: Message = {
        id: Number(data?.messageId),
        senderId: Number(data?.from),
        receiverId: Number(data?.to ?? 0),
        type: mappedType,
        message: String(data?.message ?? ''),
        messageStatus: 'delivered',
        createdAt: new Date().toISOString(),
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
    const onDeleted = ({ messageId, deleteType, deletedBy }: any) => {
      socketSync.onMessageDeleted(messageId, deleteType, { deletedBy });
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
