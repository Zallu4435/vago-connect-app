import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GET_INITIAL_CONTACTS_ROUTE } from '@/utils/ApiRoutes';
import type { Contact } from '@/types';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';

export function useContacts(userId?: string): UseQueryResult<Contact[], Error> {
  const self = useAuthStore((s) => s.userInfo);
  return useQuery<Contact[], Error>({
    queryKey: userId ? queryKeys.contacts.byUser(userId) : ['contacts', ''] as const,
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await api.get(`${GET_INITIAL_CONTACTS_ROUTE}/${userId}`);
      const rows = (data?.data as any[]) || (data?.users as any[]) || [];
      // Map server response { user, lastMessage, participantState } to UI-friendly flat item
      const mapped = rows
        .map((row) => {
          let u = row?.user;
          const isGroup = row?.type === 'group';

          if (isGroup) {
            u = {
              id: row.conversationId,
              name: row.groupName,
              description: row.groupDescription,
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
            description: (u as any).description,
            about: u.about,
            participants: u.participants,
            conversationId: row?.conversationId,
            isGroup,
            isPinned: Boolean(ps?.isPinned),
            pinOrder: typeof ps?.pinOrder === 'number' ? ps.pinOrder : 0,
            isSelf: !isGroup && String(u.id) === String(userId),
            // fields used by ChatListItem for preview/time/unread
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
      // Sort: self-chat top, then pinned (by pinOrder asc), then by last message time desc
      const sorted = mapped.slice().sort((a: any, b: any) => {
        if (a.isSelf && !b.isSelf) return -1;
        if (!a.isSelf && b.isSelf) return 1;

        if (a.isPinned && b.isPinned) return (a.pinOrder ?? 0) - (b.pinOrder ?? 0);
        if (a.isPinned) return -1;
        if (b.isPinned) return 1;
        const ta = new Date(a.timestamp || 0).getTime();
        const tb = new Date(b.timestamp || 0).getTime();
        return tb - ta;
      });
      return sorted as unknown as Contact[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

