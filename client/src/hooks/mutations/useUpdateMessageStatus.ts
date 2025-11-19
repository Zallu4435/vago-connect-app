import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { UPDATE_MESSAGE_STATUS_ROUTE } from '@/utils/ApiRoutes';

export type MessageStatus = 'delivered' | 'read';

export interface UpdateMessageStatusInput {
  messageId: number | string;
  status: MessageStatus;
}

export const useUpdateMessageStatus = (): UseMutationResult<unknown, Error, UpdateMessageStatusInput> => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, UpdateMessageStatusInput>({
    mutationFn: async ({ messageId, status }) => {
      const { data } = await api.put(UPDATE_MESSAGE_STATUS_ROUTE, { messageId, status });
      return data;
    },
    onSuccess: (_data, _variables) => {
      // Invalidate messages to refetch with updated statuses
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
};
