import { useInfiniteQuery, type UseInfiniteQueryResult, type InfiniteData } from '@tanstack/react-query';
import { MessageService } from '@/services/messageService';
import type { Contact } from '@/types';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';

interface Page {
  contacts: Contact[];
  nextCursor: string | null;
}

interface Options {
  limit?: number;
  q?: string;
}

export function useContactsPaginated(userId?: string, opts: Options = {}): UseInfiniteQueryResult<InfiniteData<Page>, Error> {
  const self = useAuthStore((s) => s.userInfo);
  const { limit = 30, q = '' } = opts;
  return useInfiniteQuery<Page, Error>({
    queryKey: userId ? [...queryKeys.contacts.byUser(userId), 'infinite', limit, q] : ['contacts', '', 'infinite', limit, q] as const,
    enabled: Boolean(userId),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? null,
    queryFn: async ({ pageParam }) => {
      const data = await MessageService.getInitialContacts({
        limit,
        q,
        cursor: pageParam ? Number(pageParam) : undefined
      });
      const rows = (data?.data as any[]) || (data?.users as any[]) || [];
      const mapped = rows
        .map((row) => {
          let u = row?.user;
          const isGroup = row?.type === 'group';

          if (isGroup) {
            u = {
              id: row.conversationId,
              name: row.groupName,
              about: row.groupDescription,
              profileImage: row.groupIcon,
              participants: row.participants || [],
            };
          } else if (!u && self) {
            u = {
              id: self.id,
              name: self.name || 'You',
              email: self.email,
              about: self.about,
              profileImage: (self as any).profileImage || (self as any).image || '',
            } as any;
          }
          if (!u) return null;
          const m = row?.lastMessage || null;
          const ps = row?.participantState || {};
          return {
            id: String(u.id),
            name: u.name,
            profilePicture: u.profileImage,
            about: u.about,
            participants: u.participants,
            conversationId: row?.conversationId,
            isGroup,
            isBlocked: Boolean(u?.isBlocked),
            blockedBy: Boolean(u?.blockedBy),
            isPinned: Boolean(ps?.isPinned),
            pinOrder: typeof ps?.pinOrder === 'number' ? ps.pinOrder : 0,
            isSelf: !isGroup && String(u.id) === String(userId),
            type: m?.type,
            message: m?.message,
            timestamp: m?.timestamp,
            senderId: m?.senderId,
            messageStatus: m?.status,
            isSystemMessage: Boolean(m?.isSystemMessage),
            systemMessageType: m?.systemMessageType || null,
            totalUnreadMessages: ps?.unreadCount || 0,
          } as any;
        })
        .filter(Boolean) as any[];
      // Server is expected to return nextCursor
      return { contacts: mapped as Contact[], nextCursor: (data?.nextCursor as string | null) ?? null };
    },
    staleTime: 1000 * 60 * 5,
  });
}
