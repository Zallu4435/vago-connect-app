import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { MessageService } from '@/services/messageService';
import type { Message } from '@/types';
import { queryKeys } from '@/lib/queryKeys';

export function useMessages(userId?: string, peerId?: string): UseQueryResult<Message[], Error> {
  return useQuery<Message[], Error>({
    queryKey: userId && peerId ? queryKeys.messages.byChat(userId, peerId) : ['messages', '', ''] as const,
    enabled: Boolean(userId && peerId),
    queryFn: async () => {
      const data = await MessageService.getMessages(Number(userId!), Number(peerId!));
      const backend = (data?.messages as any[]) || [];
      const mapped: Message[] = backend.map((m) => ({
        id: Number(m.id),
        senderId: Number(m.senderId),
        receiverId: Number(peerId),
        type: (m.type === 'audio' || m.type === 'image' || m.type === 'video' || m.type === 'location' || m.type === 'document') ? m.type : 'text',
        message: String(m.content ?? ''),
        messageStatus: (m.status as 'sent' | 'delivered' | 'read') || 'sent',
        createdAt: String(m.createdAt),
        // UI compatibility aliases
        // @ts-ignore
        content: String(m.content ?? ''),
        // @ts-ignore
        timestamp: String(m.createdAt),
        isForwarded: Boolean(m.isForwarded),
        isDeletedForEveryone: Boolean(m.isDeletedForEveryone),
        replyToMessageId: m.replyToMessageId,
        quotedMessage: m.quotedMessage,
        reactions: m.reactions,
        starredBy: m.starredBy,
        caption: m.caption,
        duration: m.duration,
        isEdited: m.isEdited,
        sender: m.sender || null,
      } as any));
      console.log("[UI DEBUG] Fetched messages from backend", mapped);
      return mapped;
    },
    staleTime: 1000 * 60 * 5,
  });
}
