import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { ChatService } from '@/services/chatService';

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
      const data = await ChatService.searchMedia(chatId!, rest as any);
      return data as SearchChatMediaResult;
    },
    staleTime: 30_000,
  });
}
