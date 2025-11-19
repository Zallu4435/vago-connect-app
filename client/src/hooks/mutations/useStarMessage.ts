import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { STAR_MESSAGE_ROUTE } from '@/utils/ApiRoutes';

export interface StarMessageInput {
  id: number | string;
  starred: boolean;
}

export function useStarMessage(): UseMutationResult<unknown, Error, StarMessageInput> {
  const qc = useQueryClient();
  return useMutation<unknown, Error, StarMessageInput>({
    mutationFn: async ({ id, starred }) => {
      const { data } = await api.post(STAR_MESSAGE_ROUTE(id), { starred });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}
