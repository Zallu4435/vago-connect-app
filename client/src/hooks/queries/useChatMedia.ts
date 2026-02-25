import { useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GET_CHAT_MEDIA_ROUTE } from '@/utils/ApiRoutes';

export interface ChatMediaQuery {
  chatId?: number | string;
  type?: 'image' | 'video' | 'audio' | 'document';
  limit?: number;
  offset?: number;
}

interface ChatMediaItem {
  mediaId: number;
  messageId: number;
  conversationId: number;
  senderId: number;
  type: string;
  url: string;
  thumbnailUrl?: string | null;
  mimeType?: string | null;
  fileSize?: string | number | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  createdAt: string;
  fileName?: string | null;
}

export function useChatMedia(params: ChatMediaQuery) {
  const { chatId, type, limit = 20 } = params;

  return useInfiniteQuery<{ items: ChatMediaItem[]; count: number }, Error>({
    queryKey: ['chat-media', chatId, type, limit],
    initialPageParam: 0,
    enabled: Boolean(chatId),
    queryFn: async ({ pageParam = 0 }) => {
      const search = new URLSearchParams();
      if (type) search.set('type', type);
      if (limit != null) search.set('limit', String(limit));
      if (pageParam != null) search.set('offset', String(pageParam));

      const url = `${GET_CHAT_MEDIA_ROUTE(chatId!)}?${search.toString()}`;
      const { data } = await api.get(url);

      return (data as { items: ChatMediaItem[]; count: number }) || { items: [], count: 0 };
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage?.items?.length === limit) {
        return allPages.length * limit;
      }
      return undefined;
    },
    staleTime: 60_000,
  });
}
