import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { MessageService } from '@/services/messageService';

export type DeleteType = 'forMe' | 'forEveryone';
export interface DeleteMessageInput {
  id: number | string;
  deleteType: DeleteType;
}

export function useDeleteMessage(): UseMutationResult<unknown, Error, DeleteMessageInput> {
  const qc = useQueryClient();
  return useMutation<unknown, Error, DeleteMessageInput>({
    mutationFn: async ({ id, deleteType }) => {
      return await MessageService.deleteMessage(id, deleteType);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}
