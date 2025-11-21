import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { FORWARD_MESSAGES_ROUTE } from '@/utils/ApiRoutes';

export interface ForwardMessagesInput {
  messageIds: Array<number | string>;
  toConversationIds: Array<number | string>;
}

export interface MinimalForwardedMessage {
  id: number;
  conversationId: number;
  senderId: number;
  type: string;
  content: string;
  status: string;
  createdAt: string;
}

export function useForwardMessages(): UseMutationResult<{ messages: MinimalForwardedMessage[] }, Error, ForwardMessagesInput> {
  const qc = useQueryClient();
  return useMutation<{ messages: MinimalForwardedMessage[] }, Error, ForwardMessagesInput>({
    mutationFn: async (input) => {
      const { data } = await api.post(FORWARD_MESSAGES_ROUTE, input);
      return data as { messages: MinimalForwardedMessage[] };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
