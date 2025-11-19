import { useQuery, UseQueryResult } from '@tanstack/react-query';
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

export function useChatMedia(params: ChatMediaQuery): UseQueryResult<{ items: ChatMediaItem[]; count: number }, Error> {
  const { chatId, type, limit = 20, offset = 0 } = params;
  return useQuery<{ items: ChatMediaItem[]; count: number }, Error>({
    queryKey: ['chat-media', chatId, type, limit, offset],
    enabled: Boolean(chatId),
    queryFn: async () => {
      const search = new URLSearchParams();
      if (type) search.set('type', type);
      if (limit != null) search.set('limit', String(limit));
      if (offset != null) search.set('offset', String(offset));
      const url = `${GET_CHAT_MEDIA_ROUTE(chatId!)}?${search.toString()}`;
      const { data } = await api.get(url);
      return (data as { items: ChatMediaItem[]; count: number }) || { items: [], count: 0 };
    },
    staleTime: 60_000,
  });
}
