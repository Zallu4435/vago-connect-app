import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { MessageService } from '@/services/messageService';
import type { Message } from '@/types';

export function useUploadFile(): UseMutationResult<Message, Error, FormData> {
  const qc = useQueryClient();
  return useMutation<Message, Error, FormData>({
    mutationFn: async (form) => {
      return await MessageService.sendFile(form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}
