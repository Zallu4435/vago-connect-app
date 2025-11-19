import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { FORWARD_MESSAGES_ROUTE } from '@/utils/ApiRoutes';
import type { Message } from '@/types';

export interface ForwardMessagesInput {
  messageIds: Array<number | string>;
  toConversationIds: Array<number | string>;
}

export function useForwardMessages(): UseMutationResult<{ messages: Message[] }, Error, ForwardMessagesInput> {
  const qc = useQueryClient();
  return useMutation<{ messages: Message[] }, Error, ForwardMessagesInput>({
    mutationFn: async (input) => {
      const { data } = await api.post(FORWARD_MESSAGES_ROUTE, input);
      return data as { messages: Message[] };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
