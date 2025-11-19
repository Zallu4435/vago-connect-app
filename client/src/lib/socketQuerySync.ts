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

    onUserOnline: (_userId: number | string) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },

    onUserOffline: (_userId: number | string) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  };
};
