import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { MessageService } from '@/services/messageService';
import type { Message } from '@/types';

export interface EditMessageInput {
  id: number | string;
  content: string;
}

export function useEditMessage(): UseMutationResult<Message, Error, EditMessageInput> {
  const qc = useQueryClient();
  return useMutation<Message, Error, EditMessageInput>({
    mutationFn: async ({ id, content }) => {
      return await MessageService.editMessage(id, content);
    },
    onSuccess: (_data, _vars) => {
      qc.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}
