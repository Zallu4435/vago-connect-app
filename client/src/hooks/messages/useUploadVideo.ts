import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { MessageService } from '@/services/messageService';
import type { Message } from '@/types';

export function useUploadVideo(): UseMutationResult<Message, Error, FormData> {
  const qc = useQueryClient();
  return useMutation<Message, Error, FormData>({
    mutationFn: async (form) => {
      return await MessageService.sendVideo(form);
    },
    onSuccess: () => {
      // Invalidate message queries so conversation refreshes
      qc.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}
