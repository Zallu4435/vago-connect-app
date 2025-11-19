import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GET_MESSAGES_ROUTE } from '@/utils/ApiRoutes';
import type { Message } from '@/types';
import { queryKeys } from '@/lib/queryKeys';

export function useMessages(userId?: string, peerId?: string): UseQueryResult<Message[], Error> {
  return useQuery<Message[], Error>({
    queryKey: userId && peerId ? queryKeys.messages.byChat(userId, peerId) : ['messages', '', ''] as const,
    enabled: Boolean(userId && peerId),
    queryFn: async () => {
      const { data } = await api.get(`${GET_MESSAGES_ROUTE}/${userId}/${peerId}`);
      const messages = (data?.messages as Message[]) || [];
      return messages;
    },
    staleTime: 1000 * 60 * 5,
  });
}
