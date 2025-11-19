import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DELETE_MESSAGE_ROUTE } from '@/utils/ApiRoutes';

export type DeleteType = 'forMe' | 'forEveryone';
export interface DeleteMessageInput {
  id: number | string;
  deleteType: DeleteType;
}

export function useDeleteMessage(): UseMutationResult<unknown, Error, DeleteMessageInput> {
  const qc = useQueryClient();
  return useMutation<unknown, Error, DeleteMessageInput>({
    mutationFn: async ({ id, deleteType }) => {
      const { data } = await api.delete(`${DELETE_MESSAGE_ROUTE(id)}?deleteType=${encodeURIComponent(deleteType)}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}
