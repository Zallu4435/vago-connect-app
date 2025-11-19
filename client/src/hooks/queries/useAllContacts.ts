import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Contact } from '@/types';
import { GET_ALL_CONTACTS_ROUTE } from '@/utils/ApiRoutes';
import { queryKeys } from '@/lib/queryKeys';

export type ContactsSections = Record<string, Contact[]>;

export const useAllContacts = (): UseQueryResult<ContactsSections, Error> => {
  return useQuery<ContactsSections, Error>({
    queryKey: queryKeys.contacts.all,
    queryFn: async () => {
      const { data } = await api.get(GET_ALL_CONTACTS_ROUTE);
      // Backend returns grouped users by first letter: { A: [...], B: [...] }
      const sections: ContactsSections = (data?.users as ContactsSections) || {};
      return sections;
    },
    staleTime: 1000 * 60 * 10,
  });
};
