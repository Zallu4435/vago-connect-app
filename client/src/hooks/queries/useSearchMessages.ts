import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { SEARCH_MESSAGES_ROUTE } from '@/utils/ApiRoutes';
import { queryKeys } from '@/lib/queryKeys';
import type { Message } from '@/types';

export interface SearchMessagesResult {
    messages: Message[];
}

export function useSearchMessages(chatId?: number | string, q: string = ''): UseQueryResult<SearchMessagesResult, Error> {
    return useQuery<SearchMessagesResult, Error>({
        queryKey: chatId ? [...queryKeys.messageSearch.byChat(chatId), q] : ['messageSearch', '', q],
        enabled: Boolean(chatId) && q.trim().length > 0,
        queryFn: async () => {
            const search = new URLSearchParams();
            if (q.trim()) search.set('q', q.trim());

            const url = `${SEARCH_MESSAGES_ROUTE(chatId!)}?${search.toString()}`;
            const { data } = await api.get(url);

            // Ensure we map it properly if needed, but the backend returns message objects
            const mapped = (data?.messages || []).map((m: any) => ({
                ...m,
                id: Number(m.id),
                senderId: Number(m.senderId),
                timestamp: String(m.createdAt),
                content: String(m.content ?? ''),
            }));

            return { messages: mapped };
        },
        staleTime: 30_000,
    });
}
