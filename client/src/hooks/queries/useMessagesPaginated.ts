import { useInfiniteQuery, type UseInfiniteQueryResult, type InfiniteData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GET_MESSAGES_ROUTE } from '@/utils/ApiRoutes';
import type { Message } from '@/types';
import { queryKeys } from '@/lib/queryKeys';

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
  return useInfiniteQuery<Page, Error>({
    queryKey: userId && peerId ? [...queryKeys.messages.byChat(userId, peerId), 'infinite', limit, markRead] : ['messages', '', '', 'infinite', limit, markRead] as const,
    enabled: Boolean(userId && peerId),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? null,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (pageParam) params.set('cursor', String(pageParam));
      // fetch older pages by default; client can reverse display order
      params.set('direction', 'before');
      if (markRead && !pageParam) params.set('markRead', 'true');
      if (opts.isGroup) params.set('isGroup', 'true');
      const { data } = await api.get(`${GET_MESSAGES_ROUTE}/${userId}/${peerId}?${params.toString()}`);
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
      return { messages: mapped, nextCursor: (data?.nextCursor as string | null) ?? null };
    },
  });
}
