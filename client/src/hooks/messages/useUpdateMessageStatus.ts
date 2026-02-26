import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { MessageService } from '@/services/messageService';

export type MessageStatus = 'delivered' | 'read';

export interface UpdateMessageStatusInput {
  messageId: number | string;
  status: MessageStatus;
}

export const useUpdateMessageStatus = (): UseMutationResult<unknown, Error, UpdateMessageStatusInput> => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, UpdateMessageStatusInput>({
    mutationFn: async ({ messageId, status }) => {
      return await MessageService.updateStatus({ messageId: messageId as number, status });
    },
    onSuccess: (_data, _variables) => {
      // Invalidate messages to refetch with updated statuses
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
};
