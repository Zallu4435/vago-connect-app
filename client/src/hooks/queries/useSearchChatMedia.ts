import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { SEARCH_CHAT_MEDIA_ROUTE } from '@/utils/ApiRoutes';

export interface SearchChatMediaParams {
  chatId?: number | string;
  type?: 'image' | 'video' | 'audio' | 'document';
  startDate?: string; // ISO
  endDate?: string;   // ISO
  minSize?: number;   // bytes
  maxSize?: number;   // bytes
  mimeType?: string;  // partial
  page?: number;
  pageSize?: number;
}

export interface SearchChatMediaResult {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  mediaItems: Array<{
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
  }>;
}

export function useSearchChatMedia(params: SearchChatMediaParams): UseQueryResult<SearchChatMediaResult, Error> {
  const { chatId, ...rest } = params;
  return useQuery<SearchChatMediaResult, Error>({
    queryKey: ['chat-media-search', chatId, rest],
    enabled: Boolean(chatId),
    queryFn: async () => {
      const search = new URLSearchParams();
      Object.entries(rest).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') search.set(k, String(v));
      });
      const url = `${SEARCH_CHAT_MEDIA_ROUTE(chatId!)}?${search.toString()}`;
      const { data } = await api.get(url);
      return data as SearchChatMediaResult;
    },
    staleTime: 30_000,
  });
}
