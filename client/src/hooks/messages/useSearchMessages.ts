import { useInfiniteQuery, UseInfiniteQueryResult, InfiniteData } from '@tanstack/react-query';
import { MessageService } from '@/services/messageService';
import { queryKeys } from '@/lib/queryKeys';
import type { Message } from '@/types';

export interface SearchMessagesResult {
    messages: Message[];
    nextCursor?: string | null;
}

export function useSearchMessages(chatId?: number | string, q: string = ''): UseInfiniteQueryResult<InfiniteData<SearchMessagesResult>, Error> {
    return useInfiniteQuery({
        queryKey: chatId ? [...queryKeys.messageSearch.byChat(chatId), q] : ['messageSearch', '', q],
        enabled: Boolean(chatId) && q.trim().length > 0,
        initialPageParam: undefined as string | undefined,
        queryFn: async ({ pageParam = undefined }) => {
            const data = await MessageService.searchMessages(chatId!, q.trim(), Number(pageParam) || undefined);

            const mapped = (data?.messages || []).map((m: any) => ({
                ...m,
                id: Number(m.id),
                senderId: Number(m.senderId),
                timestamp: String(m.createdAt),
                content: String(m.content ?? ''),
            }));

            return { messages: mapped, nextCursor: data?.nextCursor || null };
        },
        getNextPageParam: (lastPage: any) => lastPage?.nextCursor || undefined,
        staleTime: 30_000,
    });
}
