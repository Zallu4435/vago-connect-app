import { useInfiniteQuery, type UseInfiniteQueryResult, type InfiniteData, useQueryClient } from '@tanstack/react-query';
import { MessageService } from '@/services/messageService';
import type { Message } from '@/types';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import { updateContactFieldsInCache } from '@/lib/cacheHelpers';

interface Page {
  messages: Message[];
  nextCursor: string | null;
}

interface Options {
  limit?: number;
  markRead?: boolean;
  isGroup?: boolean;
}

export function useMessagesPaginated(userId?: string, peerId?: string, opts: Options = {}): UseInfiniteQueryResult<InfiniteData<Page>, Error> {
  const { limit = 50, markRead = false } = opts;
  const qc = useQueryClient();
  const authUserId = useAuthStore((s) => s.userInfo?.id);

  return useInfiniteQuery<Page, Error>({
    queryKey: (userId && peerId)
      ? [...queryKeys.messages.byChat(userId, peerId, !!opts.isGroup), 'infinite', limit, markRead]
      : ['messages', '', '', 'direct', 'infinite', limit, markRead] as const,
    enabled: Boolean(userId && peerId),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? null,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
    gcTime: 1000 * 60 * 30, // 30 mins garbage collection
    queryFn: async ({ pageParam }) => {
      const data = await MessageService.getMessages(Number(peerId!), {
        limit,
        cursor: pageParam ? Number(pageParam) : undefined,
        direction: 'before',
        markRead: markRead && !pageParam ? true : undefined,
        isGroup: opts.isGroup
      });
      const backend = (data?.messages as any[]) || [];
      const mapped: Message[] = backend.map((m) => ({
        id: Number(m.id),
        senderId: Number(m.senderId),
        receiverId: Number(peerId),
        type: (['audio', 'image', 'video', 'location', 'document', 'voice', 'call'].includes(m.type)) ? m.type : 'text',
        message: String(m.content ?? ''),
        messageStatus: (m.status as 'sent' | 'delivered' | 'read') || 'sent',
        createdAt: String(m.createdAt),
        // UI compatibility aliases used in ChatContainer.jsx
        // @ts-ignore
        content: String(m.content ?? ''),
        // @ts-ignore
        timestamp: String(m.createdAt),
        isForwarded: Boolean(m.isForwarded),
        isDeletedForEveryone: Boolean(m.isDeletedForEveryone),
        // System message flags — must be carried through or MessageWrapper won't detect them
        isSystemMessage: Boolean(m.isSystemMessage),
        systemMessageType: m.systemMessageType ?? null,
        replyToMessageId: m.replyToMessageId,
        quotedMessage: m.quotedMessage,
        reactions: m.reactions,
        starredBy: m.starredBy,
        caption: m.caption,
        duration: m.duration,
        isEdited: m.isEdited,
        sender: m.sender || null,
        deletedBy: m.deletedBy,
      } as any));
      // If we just marked read sequentially, instantly drop local contact unread badge
      if (markRead && !pageParam && authUserId && peerId) {
        updateContactFieldsInCache(qc, (c: any) => {
          const cPeerId = String(c.id);
          const cConvId = String(c.conversationId || "");

          const isMatch = opts.isGroup
            ? (cConvId !== "0" && cConvId === String(peerId))
            : (cPeerId === String(peerId));

          if (isMatch) {
            return { ...c, totalUnreadMessages: 0 };
          }
          return c;
        });
      }

      return { messages: mapped, nextCursor: (data?.nextCursor as string | null) ?? null };
    },
  });
}
