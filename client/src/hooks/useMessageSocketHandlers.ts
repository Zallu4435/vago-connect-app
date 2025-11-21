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
    if (!socket.current || attachedRef.current) return;

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
    socket.current.off('msg-recieve', onMsgReceive);
    socket.current.on('msg-recieve', onMsgReceive);
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

    socket.current.off('message-status-update', onStatusUpdate);
    socket.current.off('message-edited', onEdited);
    socket.current.off('message-deleted', onDeleted);
    socket.current.off('message-reacted', onReacted);
    socket.current.off('message-starred', onStarred);
    socket.current.off('message-forwarded', onForwarded);

    socket.current.on('message-status-update', onStatusUpdate);
    socket.current.on('message-edited', onEdited);
    socket.current.on('message-deleted', onDeleted);
    socket.current.on('message-reacted', onReacted);
    socket.current.on('message-starred', onStarred);
    socket.current.on('message-forwarded', onForwarded);

    attachedRef.current = true;

    return () => {
      if (!socket.current) return;
      socket.current.off('msg-recieve', onMsgReceive);
      socket.current.off('message-status-update', onStatusUpdate);
      socket.current.off('message-edited', onEdited);
      socket.current.off('message-deleted', onDeleted);
      socket.current.off('message-reacted', onReacted);
      socket.current.off('message-starred', onStarred);
      socket.current.off('message-forwarded', onForwarded);
      attachedRef.current = false;
    };
  }, [socket, currentChatUser?.id, addMessage, socketSync, authUserId]);
}
