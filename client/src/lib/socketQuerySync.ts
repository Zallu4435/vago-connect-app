import type { QueryClient } from '@tanstack/react-query';
import type { Message } from '@/types';
import { updateMessagesCache } from './cacheHelpers';

export const createSocketQuerySync = (queryClient: QueryClient) => {
  return {
    onMessageReceive: (message: Message, userId?: string | number, chatUserId?: string | number) => {
      if (!userId || !chatUserId) return;
      const key = ['messages', String(userId), String(chatUserId)];
      queryClient.setQueryData<Message[]>(key, (old = []) => {
        const exists = old.some((m) => m.id === message.id);
        if (exists) return old;
        return [...old, message];
      });

      // Update contacts preview and unread counts for incoming message
      const contactsKey = ['contacts', String(userId)];
      queryClient.setQueryData<any[]>(contactsKey, (old = []) => {
        if (!Array.isArray(old)) return old;
        const idx = old.findIndex((c: any) => String(c.id) === String(chatUserId));
        if (idx === -1) return old;
        const contact = old[idx] || {};
        const updated = {
          ...contact,
          message: (message as any).content || (message as any).message || contact.message,
          type: (message as any).type || 'text',
          timestamp: (message as any).timestamp || new Date().toISOString(),
          senderId: (message as any).senderId,
          isSystemMessage: Boolean((message as any).isSystemMessage),
          systemMessageType: (message as any).systemMessageType || null,
          messageStatus: (message as any).messageStatus || contact.messageStatus,
          totalUnreadMessages: (Number(contact.totalUnreadMessages) || 0) + 1,
        };
        const rest = old.filter((_, i) => i !== idx);
        return [updated, ...rest];
      });
    },

    onMessageStatusUpdate: (messageId: number | string, status: string) => {
      updateMessagesCache(queryClient, (msg: any) =>
        String(msg?.id) === String(messageId) ? { ...msg, messageStatus: status } : msg
      );
    },

    onMessagesRead: (messageIds: (number | string)[]) => {
      const idsSet = new Set(messageIds.map(String));
      updateMessagesCache(queryClient, (msg: any) =>
        idsSet.has(String(msg?.id)) ? { ...msg, messageStatus: 'read' } : msg
      );
    },

    onMessageEdited: (messageId: number | string, newContent: string, editedAt?: string) => {
      updateMessagesCache(queryClient, (msg: any) =>
        String(msg?.id) === String(messageId) ? { ...msg, content: newContent, isEdited: true, editedAt: editedAt || new Date().toISOString() } : msg
      );
    },

    onMessageDeleted: (messageId: number | string, deleteType: 'forMe' | 'forEveryone', payload?: any) => {
      updateMessagesCache(queryClient, (msg: any) => {
        if (String(msg?.id) !== String(messageId)) return msg;
        if (deleteType === 'forEveryone') return { ...msg, content: 'This message was deleted', isDeletedForEveryone: true };
        return { ...msg, deletedBy: payload?.deletedBy || [] };
      });
    },

    onMessageReacted: (messageId: number | string, reactions: any[]) => {
      updateMessagesCache(queryClient, (msg: any) =>
        String(msg?.id) === String(messageId) ? { ...msg, reactions } : msg
      );
    },

    onMessageStarred: (messageId: number | string, starred: boolean, userId?: number | string) => {
      updateMessagesCache(queryClient, (msg: any) => {
        if (String(msg?.id) !== String(messageId)) return msg;
        const arr = Array.isArray(msg.starredBy) ? msg.starredBy.slice() : [];
        const uid = Number(userId);
        const exists = arr.some((e: any) => (e?.userId ?? e) === uid);
        let next = arr;
        if (starred && !exists) next = [...arr, { userId: uid, starredAt: new Date().toISOString() }];
        if (!starred && exists) next = arr.filter((e: any) => (e?.userId ?? e) !== uid);
        return { ...msg, starredBy: next };
      });
    },

    onMessageForwarded: (_payload: { message: any; conversationId: number | string }) => {
      // We don't have a userId/peerId mapping for conversationId here, so simply invalidate
      // messages and contacts; the next query fetch will include forwarded items.
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },

    onUserOnline: (_userId: number | string) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },

    onUserOffline: (_userId: number | string) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  };
};
