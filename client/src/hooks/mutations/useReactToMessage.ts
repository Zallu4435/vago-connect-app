import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { REACT_MESSAGE_ROUTE } from '@/utils/ApiRoutes';

export interface ReactToMessageInput {
  id: number | string;
  emoji: string;
}

export function useReactToMessage(): UseMutationResult<unknown, Error, ReactToMessageInput> {
  const qc = useQueryClient();
  return useMutation<unknown, Error, ReactToMessageInput>({
    mutationFn: async ({ id, emoji }) => {
      const { data } = await api.post(REACT_MESSAGE_ROUTE(id), { emoji });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}
