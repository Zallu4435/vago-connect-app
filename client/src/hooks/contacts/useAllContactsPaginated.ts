import { useInfiniteQuery, type UseInfiniteQueryResult, type InfiniteData } from '@tanstack/react-query';
import { UserService } from '@/services/userService';
import type { Contact } from '@/types';
import { queryKeys } from '@/lib/queryKeys';

export type ContactsSections = Record<string, Contact[]>;

interface Page {
  sections: ContactsSections;
  nextCursor: string | null;
}

interface Options {
  q?: string;
  limit?: number;
  cursor?: string | null;
  sort?: 'name_asc' | 'name_desc';
}

export const useAllContactsPaginated = (opts: Options = {}): UseInfiniteQueryResult<InfiniteData<Page>, Error> => {
  const { q = '', limit = 50, sort = 'name_asc' } = opts;
  return useInfiniteQuery<Page, Error>({
    queryKey: [...queryKeys.contacts.all, 'infinite', q, limit, sort],
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last?.nextCursor ?? null,
    queryFn: async ({ pageParam }) => {
      const data = await UserService.getAllContactsPaginated({ q, limit, sort, cursor: pageParam ? Number(pageParam) : undefined });
      const sections: ContactsSections = (data?.users as ContactsSections) || {};
      const nextCursor = (data?.nextCursor as string | null) ?? null;
      return { sections, nextCursor };
    },
    staleTime: 1000 * 60 * 10,
  });
};
