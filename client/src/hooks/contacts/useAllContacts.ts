import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { UserService } from '@/services/userService';
import type { Contact } from '@/types';
import { queryKeys } from '@/lib/queryKeys';

export type ContactsSections = Record<string, Contact[]>;

export const useAllContacts = (): UseQueryResult<ContactsSections, Error> => {
  return useQuery<ContactsSections, Error>({
    queryKey: queryKeys.contacts.all,
    queryFn: async () => {
      const data = await UserService.getAllContacts();
      // Backend returns grouped users by first letter: { A: [...], B: [...] }
      const sections: ContactsSections = (data?.users as ContactsSections) || {};
      return sections;
    },
    staleTime: 1000 * 60 * 10,
  });
};
