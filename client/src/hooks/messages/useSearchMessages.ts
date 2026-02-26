import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { MessageService } from '@/services/messageService';
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
            const data = await MessageService.searchMessages(chatId!, q.trim());

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
