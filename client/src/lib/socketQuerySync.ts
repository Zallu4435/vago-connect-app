import type { QueryClient } from '@tanstack/react-query';
import type { Message } from '@/types';

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
          messageStatus: (message as any).messageStatus || contact.messageStatus,
          totalUnreadMessages: (Number(contact.totalUnreadMessages) || 0) + 1,
        };
        const rest = old.filter((_, i) => i !== idx);
        return [updated, ...rest];
      });
    },

    onMessageStatusUpdate: (messageId: number | string, status: string) => {
      // Update all message caches with this message ID
      queryClient.setQueriesData({ queryKey: ['messages'] }, (old: any) => {
        if (!old) return old;
        // old can be either an array of messages or something else based on key
        if (Array.isArray(old)) {
          return old.map((msg) => (msg?.id === messageId ? { ...msg, messageStatus: status } : msg));
        }
        return old;
      });
    },

    onMessageEdited: (messageId: number | string, newContent: string, editedAt?: string) => {
      queryClient.setQueriesData({ queryKey: ['messages'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((m) => (m?.id === messageId ? { ...m, content: newContent, isEdited: true, editedAt: editedAt || new Date().toISOString() } : m));
        }
        return old;
      });
    },

    onMessageDeleted: (messageId: number | string, deleteType: 'forMe' | 'forEveryone', payload?: any) => {
      queryClient.setQueriesData({ queryKey: ['messages'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          if (deleteType === 'forEveryone') {
            return old.map((m) => (m?.id === messageId ? { ...m, content: 'This message was deleted', isDeletedForEveryone: true } : m));
          }
          // forMe: attach deletedBy so UI can filter/hide if needed
          return old.map((m) => (m?.id === messageId ? { ...m, deletedBy: payload?.deletedBy || [] } : m));
        }
        return old;
      });
    },

    onMessageReacted: (messageId: number | string, reactions: any[]) => {
      queryClient.setQueriesData({ queryKey: ['messages'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((m) => (m?.id === messageId ? { ...m, reactions } : m));
        }
        return old;
      });
    },

    onMessageStarred: (messageId: number | string, starred: boolean, userId?: number | string) => {
      queryClient.setQueriesData({ queryKey: ['messages'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((m) => {
            if (m?.id !== messageId) return m;
            const arr = Array.isArray(m.starredBy) ? m.starredBy.slice() : [];
            const uid = Number(userId);
            const exists = arr.some((e: any) => (e?.userId ?? e) === uid);
            let next = arr;
            if (starred && !exists) next = [...arr, { userId: uid, starredAt: new Date().toISOString() }];
            if (!starred && exists) next = arr.filter((e: any) => (e?.userId ?? e) !== uid);
            return { ...m, starredBy: next };
          });
        }
        return old;
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
