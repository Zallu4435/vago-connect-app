import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GET_INITIAL_CONTACTS_ROUTE } from '@/utils/ApiRoutes';
import type { Contact } from '@/types';
import { queryKeys } from '@/lib/queryKeys';

export function useContacts(userId?: string): UseQueryResult<Contact[], Error> {
  return useQuery<Contact[], Error>({
    queryKey: userId ? queryKeys.contacts.byUser(userId) : ['contacts', ''] as const,
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await api.get(`${GET_INITIAL_CONTACTS_ROUTE}/${userId}`);
      // API may return { data: users, onlineUsers } or { users }
      const users = (data?.data as Contact[]) || (data?.users as Contact[]) || [];
      return users;
    },
    staleTime: 1000 * 60 * 5,
  });
}
