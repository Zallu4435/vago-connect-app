import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User } from '@/types';
import { CHECK_USER_ROUTE } from '@/utils/ApiRoutes';
import { queryKeys } from '@/lib/queryKeys';

export function useUser(email?: string): UseQueryResult<User | null, Error> {
  return useQuery<User | null, Error>({
    queryKey: email ? queryKeys.user.byEmail(email) : ['user', ''] as const,
    enabled: Boolean(email),
    queryFn: async () => {
      const { data } = await api.post(CHECK_USER_ROUTE, { email });
      if (data?.status && data?.user) {
        const u = data.user;
        return {
          id: String(u.id),
          name: u.name,
          email: u.email,
          profileImage: u.profileImage,
          about: u.about,
        } as User;
      }
      return null;
    },
    staleTime: 1000 * 60 * 5,
    meta: { silent: true },
  });
}
