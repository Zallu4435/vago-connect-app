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
      const backend = (data?.messages as any[]) || [];
      const mapped: Message[] = backend.map((m) => ({
        id: Number(m.id),
        senderId: Number(m.senderId),
        receiverId: Number(peerId),
        type: (m.type === 'audio' || m.type === 'image') ? m.type : 'text',
        message: String(m.content ?? ''),
        messageStatus: (m.status as 'sent'|'delivered'|'read') || 'sent',
        createdAt: String(m.createdAt),
        // UI compatibility aliases
        // @ts-ignore
        content: String(m.content ?? ''),
        // @ts-ignore
        timestamp: String(m.createdAt),
      } as any));
      return mapped;
    },
    staleTime: 1000 * 60 * 5,
  });
}
